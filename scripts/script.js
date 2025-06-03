document.addEventListener("DOMContentLoaded", function () {
  // Form functionality
  const blogForm = document.getElementById("blogForm");
  const titleInput = document.getElementById("title");
  const contentTextarea = document.getElementById("content");
  const addImageBtn = document.getElementById("addImageBtn");
  const imageFileInput = document.getElementById("imageFile");
  const imageUrlInput = document.getElementById("image");

  let currentPage = 1;

  // Toggle content textarea
  titleInput.addEventListener("focus", function () {
    contentTextarea.classList.remove("hidden");
  });

  // Image upload options
  addImageBtn.addEventListener("click", function () {
    if (imageUrlInput.classList.contains("hidden")) {
      imageUrlInput.classList.remove("hidden");
      imageUrlInput.focus();
      imageUrlInput.value = this.files[0].name;
    } else {
      imageFileInput.click();
    }
  });

  imageFileInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imageUrlInput.value = e.target.result;
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // Form submission
  blogForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = {
      title: titleInput.value,
      content: contentTextarea.value,
      image: imageUrlInput.value,
    };

    fetch("/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        // Add new post to the top
        prependPost(data);
        // Reset form
        blogForm.reset();
        contentTextarea.classList.add("hidden");
        imageUrlInput.classList.add("hidden");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // Pagination
  document.getElementById("nextPage").addEventListener("click", function () {
    currentPage++;
    loadPosts();
  });

  document.getElementById("prevPage").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      loadPosts();
    }
  });

  // FAQ toggle
  function toggleFaq(button) {
    const faqItem = button.parentElement;
    const content = faqItem.querySelector("div");
    const icon = button.querySelector(".toggle-icon");

    content.classList.toggle("hidden");
    icon.textContent = content.classList.contains("hidden") ? "+" : "-";
  }

  // Assign toggle function to window for HTML onclick
  window.toggleFaq = toggleFaq;

  // Load initial posts
  loadPosts();

  function loadPosts() {
    fetch(`/posts?page=${currentPage}`)
      .then((response) => response.json())
      .then((data) => {
        const postsContainer = document.getElementById("postsContainer");
        postsContainer.innerHTML = "";

        data.posts.forEach((post) => {
          postsContainer.appendChild(createPostElement(post));
        });

        document.getElementById(
          "pageIndicator"
        ).textContent = `${data.currentPage} of ${data.totalPages}`;

        // Disable prev button if on first page
        document.getElementById("prevPage").disabled = data.currentPage === 1;
        // Disable next button if on last page
        document.getElementById("nextPage").disabled =
          data.currentPage === data.totalPages;
      });
  }

  function prependPost(post) {
    const postsContainer = document.getElementById("postsContainer");
    postsContainer.prepend(createPostElement(post));
  }

  function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className =
      "post-card bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300";
    postElement.innerHTML = `
        <div class="h-48 overflow-hidden">
          <img src="${post.image}" alt="${post.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-6">
          <div class="flex items-center mb-2">
            <span class="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">${post.category}</span>
            <span class="text-gray-500 text-sm ml-auto">${post.date}</span>
          </div>
          <h3 class="text-xl font-bold mb-2">${post.title}</h3>
          <p class="text-gray-600 mb-4">${post.content}</p>
          <div class="flex items-center">
            <img src="${post.authorImage}" alt="${post.author}" class="w-8 h-8 rounded-full mr-2">
            <span class="text-sm font-medium">${post.author}</span>
          </div>
        </div>
      `;
    return postElement;
  }
});
