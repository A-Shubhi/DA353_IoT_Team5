const fs = require('fs');
const csv = require('csv-parser');
const { createCanvas, loadImage } = require('canvas');
const { MongoClient, GridFSBucket } = require('mongodb');

// MongoDB connection settings
const mongoUrl = 'mongodb+srv://shubhiagarwal2494:<password>.ihghi3c.mongodb.net/?retryWrites=true&w=majority&appName=esp32';
const dbName = 'data';
const collectionName1 = 'fertilizer';
const collectionName2 = 'images'; // Custom collection name for images

// Function to read CSV file and insert data into MongoDB
async function insertCsvData(filePath, collectionName) {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Read CSV file
        const data = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Push each row from CSV into data array
                data.push(row);
            })
            .on('end', async () => {
                // Insert data into MongoDB collection
                const result = await collection.insertMany(data);
                console.log(`${result.insertedCount} documents inserted successfully from CSV file.`);
                // Close MongoDB connection
                await client.close();
            });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to upload images from a folder to MongoDB collection as separate R, G, B arrays
async function uploadImagesToCollection(folderPath, collectionName) {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Read files from the folder
        fs.readdir(folderPath, async (err, files) => {
            if (err) {
                console.error('Error reading folder:', err);
                return;
            }

            // Process each image file
            for (const file of files) {
                const filePath = `${folderPath}/${file}`;

                // Convert image to separate R, G, B arrays
                const { rArray, gArray, bArray } = await extractRGBArrays(filePath);

                // Insert the R, G, B arrays into MongoDB collection
                await collection.insertOne({ filename: file, r: rArray.join(','), g: gArray.join(','), b: bArray.join(',') });

                console.log(`Uploaded ${file} to collection '${collectionName}'`);
            }

            // Close MongoDB connection
            await client.close();
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to extract separate R, G, B arrays from an image
async function extractRGBArrays(imagePath) {
    try {
        // Load the image using canvas
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Get the image data
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const { width, height, data } = imageData;

        // Extract separate R, G, B arrays
        const rArray = [];
        const gArray = [];
        const bArray = [];
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const dataIndex = (i * width + j) * 4;
                const r = data[dataIndex];
                const g = data[dataIndex + 1];
                const b = data[dataIndex + 2];
                rArray.push(r.toString());
                gArray.push(g.toString());
                bArray.push(b.toString());
            }
        }

        return { rArray, gArray, bArray };
    } catch (error) {
        console.error('Error:', error);
        return { rArray: [], gArray: [], bArray: [] };
    }
}


// Example usage:
const csvFilePath = 'fertilizer.csv';
//insertCsvData(csvFilePath, collectionName1);

const imagesFolderPath = 'test';
//uploadImagesToCollection(imagesFolderPath, collectionName2);

// Function to insert single data object into MongoDB collection
async function insertData(dataObject, collectionName) {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Insert data object into MongoDB collection
        const result = await collection.insertOne(dataObject);
        console.log(`1 document inserted successfully into collection '${collectionName}'.`);
        
        // Close MongoDB connection
        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to upload a single image to MongoDB collection
async function uploadImageToCollection(imagePath, collectionName) {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Convert image to separate R, G, B arrays
        const { rArray, gArray, bArray } = await extractRGBArrays(imagePath);

        // Insert the R, G, B arrays into MongoDB collection
        await collection.insertOne({ filename: imagePath, r: rArray.join(','), g: gArray.join(','), b: bArray.join(',') });

        console.log(`Uploaded ${imagePath} to collection '${collectionName}'`);
        
        // Close MongoDB connection
        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example usage:
const singleData = { /* Your data object here */ };
//insertData(singleData, collectionName1);

const singleImagePath = 'image.jpg';
//uploadImageToCollection(singleImagePath, collectionName2);
