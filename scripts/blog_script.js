// Global state
let currentPage = 1;
let totalPages = 1;

// Load posts from server and render them
async function loadPosts(page = 1) {
  try {
    const response = await fetch(
      `http://127.0.0.1:3000/pagination-posts?page=${page}&limit=4`
    );
    const data = await response.json();

    currentPage = data.page || 1;
    totalPages = data.totalPages || 1;

    const container = document.getElementById("postsContainer");
    container.innerHTML = "";

    data.posts.forEach((post) => {
      const postEl = document.createElement("div");
      postEl.className = "border p-4 rounded shadow";

      postEl.innerHTML = `
        <h3 class="font-semibold text-lg mb-2">${escapeHtml(post.title)}</h3>
        <p class="mb-2">${escapeHtml(post.content)}</p>
        ${
          post.image
            ? `<img src="${post.image}" alt="Post image" class="mb-2 max-w-full h-auto rounded" />`
            : ""
        }
        <div class="flex space-x-2">
          <button class="download-btn bg-blue-600 text-white px-3 py-1 rounded" data-id="${
            post.id
          }">
            Download Image
          </button>
        </div>
      `;

      container.appendChild(postEl);
    });

    // Attach download button listeners
    document.querySelectorAll(".download-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const postId = btn.getAttribute("data-id");
        downloadPostImage(postId);
      });
    });

    // Update pagination UI
    document.getElementById(
      "pageIndicator"
    ).textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled = currentPage >= totalPages;
  } catch (error) {
    console.error("Error loading posts:", error);
    alert("Failed to load blog posts.");
  }
}



// Form submit handler
document.getElementById("blogForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const imageUrl = document.getElementById("image").value.trim();
    const imageFile = document.getElementById("imageFile").files[0];

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (imageFile) {
      formData.append("image_file", imageFile);
    } else if (imageUrl) {
      formData.append("imageUrl", imageUrl); // must match backend

      if (!title) {
        alert("Title is required.");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:3000/posts", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
        e.target.reset();
        document.getElementById("content").classList.add("hidden");
        document.getElementById("image").classList.add("hidden");
        document.getElementById("imageFile").value = "";
        loadPosts(1);
      } catch (err) {
        console.error("Full error:", err);
        alert(`Error: ${err.message}`);
      }
    }
});

  
// Escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Download image
function downloadPostImage(postId) {
  const a = document.createElement("a");
  a.href = `http://127.0.0.1:3000/posts/${postId}/download`;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Pagination buttons
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) loadPosts(currentPage - 1);
});
document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < totalPages) loadPosts(currentPage + 1);
});

// Toggle image URL input and file picker
document.getElementById("addImageBtn").addEventListener("click", () => {
  const imageInput = document.getElementById("image");
  const contentInput = document.getElementById("content");
  const imageFileInput = document.getElementById("imageFile");

  imageInput.classList.remove("hidden");
  contentInput.classList.remove("hidden");
  imageFileInput.click();
});

// When file selected, show file name in image URL input
document.getElementById("imageFile").addEventListener("change", function () {
  if (this.files.length > 0) {
    const file = this.files[0];
    const imageInput = document.getElementById("image");
    imageInput.classList.remove("hidden");
    imageInput.value = file.name;
  }
});

// FAQ toggle function
function toggleFaq(button) {
  const content = button.nextElementSibling;
  const icon = button.querySelector(".toggle-icon");
  const isHidden = content.classList.contains("hidden");

  content.classList.toggle("hidden");
  icon.textContent = isHidden ? "−" : "+";
  button.setAttribute("aria-expanded", String(isHidden));
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});
