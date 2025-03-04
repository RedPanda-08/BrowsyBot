// server.js - Updated CORS and Error Handling

import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
const PORT = 3000;

// More permissive CORS settings for debugging
app.use(cors({
    // Allow all origins during development
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Middleware
app.use(express.json());

// Database Connection
const db = new sqlite3.Database('browsing_history.db', (err) => {
    if (err) {
        console.error("Error connecting to database:", err);
    } else {
        console.log("Connected to database");
        createTables();
    }
});

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS browsing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT NOT NULL,
            note TEXT,
            tag TEXT,
            browser_visited_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating table:", err);
        } else {
            console.log("Table created or already exists");
        }
    });
}

// Simple health check endpoint
app.get("/", (req, res) => {
    res.json({ status: "Server is running" });
});

// Get history endpoint with better error handling
app.get("/history", (req, res) => {
    console.log("Received history request");
    
    db.all(
        'SELECT * FROM browsing_history ORDER BY browser_visited_on DESC',
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ 
                    error: "Error fetching history",
                    message: err.message 
                });
            }
            console.log(`Returning ${rows?.length || 0} history items`);
            res.json(rows || []);
        }
    );
});

// Enhanced save endpoint with better error handling
app.post("/save", (req, res) => {
    console.log("Received save request body:", JSON.stringify(req.body));
    
    const { url, title, note, tag } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    db.run(
        'INSERT INTO browsing_history (url, title, note, tag) VALUES (?, ?, ?, ?)',
        [url, title || "", note || "", tag || ""],
        function(err) {
            if (err) {
                console.error("Save error:", err);
                return res.status(500).json({ 
                    error: "Error saving page",
                    message: err.message 
                });
            }
            res.json({ 
                message: "Page saved successfully", 
                id: this.lastID 
            });
        }
    );
});

// Options endpoint to handle preflight requests
app.options("*", cors());

// Start server with better output
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Handle server errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

// Better error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});