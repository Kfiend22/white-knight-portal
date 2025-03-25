const Job = require('../../models/Job');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Make fs methods promise-based
const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);
const existsAsync = promisify(fs.access);
const exists = async (path) => {
  try {
    await existsAsync(path);
    return true;
  } catch {
    return false;
  }
};

// Configure multer storage for temporary file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use a temporary upload directory
    const tempDir = path.join(__dirname, '../../uploads/temp');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Add a timestamp to avoid filename collisions
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    cb(null, `${basename}-${timestamp}${extension}`);
  }
});

// Create the multer upload instance
const upload = multer({ storage: storage });

// Helper function to get the vendor ID for a job
const getJobVendorId = async (job) => {
  try {
    // If the job has a driver assigned, use their vendor ID first
    if (job.driverId) {
      const User = require('../../models/userModel');
      const driver = await User.findById(job.driverId);
      if (driver && (driver.vendorId || driver.vendorNumber)) {
        return driver.vendorId || driver.vendorNumber;
      }
    }
    
    // If no driver or driver has no vendor ID, use the provider's vendor ID
    if (job.provider) {
      const User = require('../../models/userModel');
      const provider = await User.findById(job.provider);
      if (provider && (provider.vendorId || provider.vendorNumber)) {
        return provider.vendorId || provider.vendorNumber;
      }
    }
    
    // If no vendor ID is found, use a default
    return 'unknown-vendor';
  } catch (error) {
    console.error('Error getting vendor ID for job:', error);
    return 'unknown-vendor'; // Fallback
  }
};

// Upload documents for a job
const uploadJobDocuments = async (req, res) => {
  try {
    // Process the file upload
    upload.array('documents')(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(400).json({ message: 'Error uploading files', error: err.message });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const jobId = req.params.id;
      
      // Find the job
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Get vendor ID for this job
      const vendorId = await getJobVendorId(job);
      const poNumber = job.po;
      
      // Create the directory path
      const jobDir = path.join(__dirname, '../../uploads/jobs', vendorId, poNumber);
      
      // Create directory if it doesn't exist
      await mkdir(jobDir, { recursive: true });
      
      // Initialize documents array if it doesn't exist
      if (!job.documents) {
        job.documents = [];
      }
      
      // Process each uploaded file
      const uploadedDocs = [];
      
      for (const file of req.files) {
        // Generate a unique filename to prevent collisions
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const uniqueFilename = `${basename}-${timestamp}${ext}`;
        
        // Move the file from the temporary location to the job directory
        const targetPath = path.join(jobDir, uniqueFilename);
        await rename(file.path, targetPath);
        
        // Create a document entry
        const documentEntry = {
          filename: uniqueFilename,
          path: path.join('uploads', 'jobs', vendorId, poNumber, uniqueFilename).replace(/\\/g, '/'),
          uploadedBy: req.user.id,
          uploadedAt: new Date()
        };
        
        // Add to job's documents array
        job.documents.push(documentEntry);
        uploadedDocs.push(documentEntry);
      }
      
      // Save the updated job
      await job.save();
      
      res.status(200).json({
        message: `${req.files.length} documents uploaded successfully`,
        documents: uploadedDocs
      });
    });
  } catch (error) {
    console.error('Error in uploadJobDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all documents for a job
const getJobDocuments = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Return the documents array
    res.status(200).json({
      documents: job.documents || []
    });
  } catch (error) {
    console.error('Error getting job documents:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download a specific document for a job
const downloadJobDocument = async (req, res) => {
  try {
    const jobId = req.params.id;
    const filename = req.params.filename;
    
    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Find the document in the job's documents array
    const document = job.documents.find(doc => doc.filename === filename);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Construct the file path
    const filePath = path.join(__dirname, '../..', document.path);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Send the file as download
    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: error.message });
  }
};

// View a specific document for a job (for images in browser)
const viewJobDocument = async (req, res) => {
  try {
    const jobId = req.params.id;
    const filename = req.params.filename;
    
    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Find the document in the job's documents array
    const document = job.documents.find(doc => doc.filename === filename);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Construct the file path
    const filePath = path.join(__dirname, '../..', document.path);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Send the file content (not as a download)
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a specific document for a job
const deleteJobDocument = async (req, res) => {
  try {
    const jobId = req.params.id;
    const filename = req.params.filename;
    
    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Find the document in the job's documents array
    const documentIndex = job.documents.findIndex(doc => doc.filename === filename);
    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const document = job.documents[documentIndex];
    
    // Construct the file path
    const filePath = path.join(__dirname, '../..', document.path);
    
    // Check if the file exists
    if (await exists(filePath)) {
      // Delete the file from the filesystem
      try {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted successfully`);
      } catch (unlinkError) {
        console.error(`Error deleting file ${filePath}:`, unlinkError);
        // Continue even if file deletion fails, to remove the database entry
      }
    } else {
      console.warn(`File ${filePath} not found on filesystem, but will remove from database`);
    }
    
    // Remove the document from the job's documents array
    job.documents.splice(documentIndex, 1);
    
    // Save the updated job
    await job.save();
    
    res.status(200).json({
      message: 'Document deleted successfully',
      deletedDocument: document
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  getJobVendorId,
  uploadJobDocuments,
  getJobDocuments,
  downloadJobDocument,
  viewJobDocument,
  deleteJobDocument
};
