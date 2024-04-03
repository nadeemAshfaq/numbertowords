require("dotenv").config();
const http = require("http");
const express = require("express");
const app = express();
const converter = require("number-to-words");
const { convertCurrency } = require("number-currency");

const numberToText = require("number-to-text");
require("number-to-text/converters/en-us");
require("number-to-text/converters/en-in");
require("number-to-text/converters/de");
require("number-to-text/converters/tr");
require("number-to-text/converters/id");

// Enable CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://localhost:44333"); // Allow requests from React app origin
  res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
  res.setHeader("Access-Control-Allow-Origin", "https://www.numbertowordsexcel.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE"); // Allow specific HTTP methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow specific headers
  res.setHeader("Access-Control-Allow-Credentials", true); // Allow cookies, if needed
  next();
});

// Define the starting port number
let port = process.env.PORT || 8000;

// Create a server instance
const server = http.createServer(app);

// Define a function to start the server
const startServer = () => {
  server.listen(port, () => {
    console.log(`Server listening on port ${server.address().port}`);
  });
};

// Attempt to start the server
startServer();

// Handle case where port is already in use
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.warn(`Port ${port} is already in use, trying another port...`);
    // Try the next port
    port++;
    startServer();
  } else {
    console.error("Server could not start:", error);
  }
});

app.use((req, res, next) => {
  req.language = req.query.language || "en-us"; // Default language is en-us
  next();
});

//////////////working api for npm i number-to-words/////////////////
app.get("/convert", async (req, res) => {
  let numbers = req.query.numbers;

  // If numbers is not an array, convert it to an array with a single element
  if (!Array.isArray(numbers)) {
    numbers = [numbers];
  }

  const batchSize = 1000; // Define the batch size
  const totalBatches = Math.ceil(numbers.length / batchSize); // Calculate total batches
  const wordsArray = [];

  try {
    // Process each batch asynchronously
    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, numbers.length);
      const batchNumbers = numbers.slice(startIdx, endIdx);

      const batchWords = await processBatch(batchNumbers);
      wordsArray.push(...batchWords);
    }

    res.json({ message: "Success", wordsArray });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});

// Function to process a batch of numbers asynchronously
async function processBatch(batchNumbers) {
  const wordsArray = [];

  for (const number of batchNumbers) {
    const parsedNumber = parseInt(number);
    if (!isNaN(parsedNumber)) {
      try {
        const words = converter.toWords(parsedNumber);
        console.log(`Converted ${parsedNumber} to "${words}"`);
        wordsArray.push(words);
      } catch (error) {
        console.error(`Error converting ${parsedNumber} to words:`, error);
        wordsArray.push(`Error converting ${parsedNumber} to words: ${error.message}`);
      }
    } else {
      console.error(`Invalid number: ${number}`);
      wordsArray.push(`Invalid number: ${number}`);
    }
  }

  return wordsArray;
}

/////////////////////////////////////////////////

///////////////working api for npm i number-currency/////////////
app.get("/numbertocurrency", async (req, res) => {
  let { numbers, currency = "usd", cent } = req.query;

  if (!numbers) {
    return res.status(400).json({ message: "Invalid numbers provided" });
  }

  const numbersArray = numbers.split(",");

  const batchSize = 1000; // Define the batch size
  const totalBatches = Math.ceil(numbersArray.length / batchSize); // Calculate total batches
  const wordsArray = [];

  try {
    // Process each batch asynchronously
    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, numbersArray.length);
      const batchNumbers = numbersArray.slice(startIdx, endIdx);

      const batchWords = await processCurrencyBatch(batchNumbers, currency, cent);
      wordsArray.push(...batchWords);
    }

    res.json({ message: "Success", wordsArray });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});

// Function to process a batch of numbers asynchronously
async function processCurrencyBatch(batchNumbers, currency, cent) {
  const wordsArray = [];

  for (const number of batchNumbers) {
    const parsedNumber = parseFloat(number);
    if (isNaN(parsedNumber)) {
      console.error(`Invalid number: ${number}`);
      wordsArray.push(`Invalid number: ${number}`);
      continue;
    }

    const words = convertCurrency(parsedNumber, currency, cent);
    console.log(`Converted ${number} to "${words}"`);
    wordsArray.push(words);
  }

  return wordsArray;
}

/////////////////////////////////

//////////////////working api for npm i number-to-text////////////
app.get("/numbertotext", async (req, res) => {
  const numbers = req.query.numbers;

  if (!numbers) {
    return res.status(400).json({ message: "Invalid numbers provided" });
  }

  const numbersArray = Array.isArray(numbers) ? numbers : [numbers];
  const batchSize = 1000; // Define the batch size
  const totalBatches = Math.ceil(numbersArray.length / batchSize); // Calculate total batches
  const wordsArray = [];

  try {
    // Process each batch asynchronously
    await Promise.all(
      Array.from({ length: totalBatches }, async (_, i) => {
        const startIdx = i * batchSize;
        const endIdx = Math.min(startIdx + batchSize, numbersArray.length);
        const batchNumbers = numbersArray.slice(startIdx, endIdx);

        const batchWords = await processNumberToTextBatch(batchNumbers, req.query.language);
        wordsArray.push(...batchWords);
      })
    );

    res.json({ message: "Success", wordsArray });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});

// Function to process a batch of numbers asynchronously
async function processNumberToTextBatch(batchNumbers, language) {
  const wordsArray = [];

  for (const number of batchNumbers) {
    const parsedNumber = parseInt(number);
    if (isNaN(parsedNumber)) {
      console.error(`Invalid number: ${number}`);
      wordsArray.push(`Invalid number: ${number}`);
      continue;
    }

    try {
      const words = numberToText.convertToText(parsedNumber, { language });
      console.log(`Converted ${parsedNumber} to "${words}"`);
      wordsArray.push(words);
    } catch (error) {
      console.error(`Error converting ${parsedNumber} to words:`, error);
      wordsArray.push(`Error converting ${parsedNumber} to words: ${error.message}`);
    }
  }

  return wordsArray;
}

///////////////////////////////////////

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
