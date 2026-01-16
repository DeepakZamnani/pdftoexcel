import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function checkIfPasswordProtected(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    return new Promise((resolve) => {
      loadingTask.promise
        .then(() => {
          resolve(false);
        })
        .catch((error: any) => {
          if (error.name === 'PasswordException') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  } catch (error) {
    console.error('Error checking PDF:', error);
    return false;
  }
}

export async function unlockPDF(file: File, password: string): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF with password using pdfjs
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password
    });

    let pdfDocument;
    try {
      pdfDocument = await loadingTask.promise;
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        throw new Error('Incorrect password. Please try again.');
      }
      throw new Error('Failed to unlock PDF. Please check the password.');
    }

    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();

    // Copy each page from the original PDF
    const numPages = pdfDocument.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas to render page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to image
      const imageData = canvas.toDataURL('image/png');
      const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());

      // Embed image in new PDF
      const image = await newPdfDoc.embedPng(imageBytes);
      const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    // Save the new unlocked PDF
    const unlockedBytes = await newPdfDoc.save();
    
    // Create new File object
    const unlockedFile = new File(
      [unlockedBytes as unknown as Blob], 
      file.name.replace('.pdf', '_unlocked.pdf'),
      { type: 'application/pdf' }
    );

    return unlockedFile;
  } catch (error: any) {
    if (error.message.includes('Incorrect password')) {
      throw error;
    }
    console.error('Unlock error:', error);
    throw new Error('Failed to unlock PDF: ' + error.message);
  }
}