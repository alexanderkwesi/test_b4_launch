const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Set view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

// Data storage (in-memory for this example)
let posts = [
  {
    id: 1,
    title: "The Rich Flavors of West African Cuisine",
    content:
      "Exploring the diverse and vibrant food culture from Nigeria to Senegal...",
    category: "Food",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1380&q=80",
    author: "Amina Diallo",
    authorImage: "https://randomuser.me/api/portraits/women/44.jpg",
    date: "2 days ago",
  },
  // Add more sample posts as needed
];

// Routes
app.get("/", (req, res) => {
  res.render("index", { posts: posts.slice(0, 3) });
});

app.get("/posts", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {
    currentPage: page,
    totalPages: Math.ceil(posts.length / limit),
    posts: posts.slice(startIndex, endIndex),
  };

  res.json(results);
});

app.post("/posts", (req, res) => {
  const { title, content, image, author } = req.body;
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    image:
      image ||
      "https://images.unsplash.com/photo-1544531586-fde5298cdd40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    category: "General",
    author: author || "Anonymous",
    authorImage: "https://randomuser.me/api/portraits/lego/5.jpg",
    date: "Just now",
  };

  posts.unshift(newPost);
  res.status(201).json(newPost);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
