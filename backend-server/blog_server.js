const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PGUSER || "",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "afrilish_blog",
  password: process.env.PGPASSWORD || "",
  port: process.env.PGPORT || 5432,
});

// Auto-create posts table if it doesn't exist
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(query);
};
createTable().catch((err) => {
  console.error("Error creating posts table:", err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static assets

// Ensure upload folder exists
const uploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ROUTES */

// Create post
app.post("/posts", upload.single("image_file"), async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const content = req.body.content?.trim();
    const imageUrl = req.body.imageUrl?.trim();

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`; // Accessible via /public/uploads
    } else if (imageUrl) {
      image = imageUrl; // Direct external image URL
    }

    const insertQuery = `
      INSERT INTO posts (title, content, image)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [title, content, image]);
    res.status(200).json({"Successfully posted":result.rows[0]});
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get paginated posts
app.get("/pagination-posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 4);
    const offset = (page - 1) * limit;

    const countResult = await pool.query("SELECT COUNT(*) FROM posts");
    const totalPosts = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalPosts / limit);

    const postsResult = await pool.query(
      `
      SELECT * FROM posts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    res.json({
      page,
      totalPages,
      totalPosts,
      posts: postsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update post
app.put("/posts/:id", upload.single("image_file"), async (req, res) => {
  try {
    const postId = req.params.id;
    const title = req.body.title?.trim();
    const content = req.body.content?.trim();
    const imageUrl = req.body.imageUrl?.trim();

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      image = imageUrl;
    }

    const updateQuery = `
      UPDATE posts
      SET title = $1, content = $2, image = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [
      title,
      content,
      image,
      postId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Share post (get data and share URL)
app.get("/posts/:id/share", async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [
      postId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    const post = result.rows[0];
    const shareUrl = `${req.protocol}://${req.get("host")}/posts/${post.id}`;

    res.json({ post, shareUrl });
  } catch (err) {
    console.error("Error sharing post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Download image for a post
app.get("/posts/:id/download", async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await pool.query("SELECT image FROM posts WHERE id = $1", [
      postId,
    ]);

    if (result.rowCount === 0 || !result.rows[0].image) {
      return res.status(404).json({ error: "Image not found." });
    }

    const imagePath = result.rows[0].image;
    const absolutePath = path.join(__dirname, "public", imagePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Image file not found on server." });
    }

    res.download(absolutePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).end();
      }
    });
  } catch (err) {
    console.error("Error downloading image:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend-template/blog.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Afrilish Blog Server running at http://127.0.0.1:${PORT}`);
});
