const videosCache = {
  feedback: { data: null, timestamp: null },
  behind: { data: null, timestamp: null },
  duration: 5 * 60 * 1000, // 5 دقائق
};

let currentVideoPage = 1;
const videosPerPage = 6;
const videosData = {};
let videoType = "feedback"; // Default type changed to feedback

// ✅ جلب الفيديوهات من Firebase مع Cache
async function fetchVideosFromFirebase(forceRefresh = false) {
  try {
    const now = Date.now();

    // Feedback videos
    if (
      forceRefresh ||
      !videosCache.feedback.data ||
      !videosCache.feedback.timestamp ||
      now - videosCache.feedback.timestamp >= videosCache.duration
    ) {
      const feedbackResponse = await fetch(
        "https://project-ahmed-45d30-default-rtdb.firebaseio.com/presentation.json"
      );
      const feedbackData = await feedbackResponse.json();

      if (feedbackData) {
        videosData.feedback = Object.values(feedbackData);
        videosCache.feedback.data = videosData.feedback;
        videosCache.feedback.timestamp = now;
        console.log("[v0] تم جلب فيديوهات فدباك الطلاب من Firebase");
      }
    } else {
      videosData.feedback = videosCache.feedback.data;
      console.log("[v0] استخدام فيديوهات فدباك الطلاب من الـ Cache");
    }

    // Behind the scenes videos
    if (
      forceRefresh ||
      !videosCache.behind.data ||
      !videosCache.behind.timestamp ||
      now - videosCache.behind.timestamp >= videosCache.duration
    ) {
      const behindResponse = await fetch(
        "https://project-ahmed-45d30-default-rtdb.firebaseio.com/Sales.json"
      );
      const behindData = await behindResponse.json();

      if (behindData) {
        videosData.behind = Object.values(behindData);
        videosCache.behind.data = videosData.behind;
        videosCache.behind.timestamp = now;
        console.log("[v0] تم جلب فيديوهات كواليس الطلاب من Firebase");
      }
    } else {
      videosData.behind = videosCache.behind.data;
      console.log("[v0] استخدام فيديوهات كواليس الطلاب من الـ Cache");
    }

    console.log("[v0] تم جلب الفيديوهات من Firebase بنجاح");
  } catch (error) {
    console.error("[v0] خطأ في جلب الفيديوهات من Firebase:", error);
  }
}

// ✅ تحميل الفيديوهات في الصفحة
async function loadVideos(page = 1, forceRefresh = false) {
  await fetchVideosFromFirebase(forceRefresh);

  const container = document.getElementById("videosContainer");
  const videos = videosData[videoType] || [];

  if (videos.length === 0) {
    const videoTypeText =
      videoType === "feedback"
        ? "فيديوهات فدباك الطلاب"
        : "فيديوهات كواليس الطلاب";
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center">
          <i class="fas fa-exclamation-triangle me-2"></i>
          لا توجد ${videoTypeText} متاحة حالياً
        </div>
      </div>
    `;
    console.log("[v0] لا توجد فيديوهات من النوع:", videoType);
    return;
  }

  console.log("[v0] تم تحميل", videos.length, "فيديو من النوع:", videoType);

  const startIndex = (page - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const paginatedVideos = videos.slice(startIndex, endIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  container.innerHTML = paginatedVideos
    .map(
      (video, index) => `
        <div class="col-md-6 col-lg-4">
          <div class="video-item" data-video-index="${startIndex + index}">
            <div class="video-thumbnail">
              <img src="${
                video.thumbnail ||
                video.thumbnailUrl ||
                "/placeholder.svg?height=400&width=600"
              }"
                alt="${video.title}"
                loading="lazy"
                decoding="async"
                onerror="this.src='/placeholder.svg?height=400&width=600'">
              <div class="video-play-icon">
                <i class="fas fa-play"></i>
              </div>
            </div>
            <div class="video-info">
              <h4>${video.title}</h4>
              <p class="text-muted mb-0">${video.description || ""}</p>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  // ✅ Pagination
  if (totalPages > 1) {
    const paginationHTML = `
      <div class="col-12">
        <nav aria-label="Videos pagination">
          <ul class="pagination justify-content-center mt-4">
            <li class="page-item ${page === 1 ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${page - 1}">السابق</a>
            </li>
            ${Array.from({ length: totalPages }, (_, i) => i + 1)
              .map(
                (p) => `
              <li class="page-item ${p === page ? "active" : ""}">
                <a class="page-link" href="#" data-page="${p}">${p}</a>
              </li>
            `
              )
              .join("")}
            <li class="page-item ${page === totalPages ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${page + 1}">التالي</a>
            </li>
          </ul>
        </nav>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", paginationHTML);

    document.querySelectorAll(".pagination .page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const newPage = Number.parseInt(e.target.getAttribute("data-page"));
        if (newPage > 0 && newPage <= totalPages) {
          currentVideoPage = newPage;
          loadVideos(newPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  setTimeout(() => {
    document.querySelectorAll(".video-item").forEach((item) => {
      item.addEventListener("click", function () {
        const index = Number.parseInt(this.getAttribute("data-video-index"));
        playVideo(index);
      });
    });
  }, 100);
}

// ✅ تشغيل الفيديو
function playVideo(index) {
  const videos = videosData[videoType] || [];
  const video = videos[index];

  if (!video) {
    alert("الفيديو غير متوفر حالياً");
    return;
  }

  const modal = document.getElementById("videoModal");
  const modalTitle = document.getElementById("videoModalTitle");
  const modalBody = modal.querySelector(".modal-body");

  if (modal && modalTitle && modalBody) {
    modalTitle.textContent = video.title;
    const videoUrl = video.src || video.videoUrl || video.url;

    if (
      videoUrl &&
      (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))
    ) {
      const embedUrl = convertYouTubeUrl(videoUrl);
      modalBody.innerHTML = `
        <div class="ratio ratio-16x9">
          <iframe src="${embedUrl}?autoplay=1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="w-100 h-100">
          </iframe>
        </div>
      `;
    } else if (videoUrl && videoUrl.includes("drive.google.com")) {
      let fileId = "";
      if (videoUrl.includes("/file/d/")) {
        fileId = videoUrl.split("/file/d/")[1].split("/")[0];
      } else if (videoUrl.includes("id=")) {
        fileId = videoUrl.split("id=")[1].split("&")[0];
      }

      if (fileId) {
        modalBody.innerHTML = `
          <div class="ratio ratio-16x9">
            <iframe src="https://drive.google.com/file/d/${fileId}/preview"
                    allow="autoplay"
                    allowfullscreen
                    class="w-100 h-100">
            </iframe>
          </div>
        `;
      } else {
        alert("رابط الفيديو غير صحيح");
        return;
      }
    } else if (videoUrl) {
      modalBody.innerHTML = `
        <div class="ratio ratio-16x9">
          <video id="modalVideo" controls autoplay class="w-100 h-100">
            <source src="${videoUrl}" type="video/mp4">
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
      `;
    } else {
      alert("الفيديو غير متوفر حالياً");
      return;
    }

    const bsModal = new window.bootstrap.Modal(modal);
    bsModal.show();

    modal.addEventListener(
      "hidden.bs.modal",
      () => {
        const videoElement = document.getElementById("modalVideo");
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
          videoElement.src = "";
        }
        modalBody.innerHTML = "";
      },
      { once: true }
    );
  }
}

// ✅ تحويل رابط يوتيوب
function convertYouTubeUrl(url) {
  let videoId = "";

  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("/embed/")) {
    videoId = url.split("/embed/")[1].split("?")[0];
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

// ✅ تحميل الفيديوهات عند فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");

  if (typeParam === "feedback") {
    videoType = "feedback";
    console.log("[v0] تم تحديد نوع الفيديو من URL: feedback");
  } else if (typeParam === "behind") {
    videoType = "behind";
    console.log("[v0] تم تحديد نوع الفيديو من URL: behind");
  } else {
    videoType = "feedback";
    console.log("[v0] تم تحديد نوع الفيديو الافتراضي: feedback");
  }

  loadVideos(currentVideoPage);

  // ✅ زر تحديث الفيديوهات
  const refreshBtn = document.getElementById("refreshVideosBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      console.log("[v0] تحديث الفيديوهات يدوياً...");
      loadVideos(1, true);
    });
  }

  // ✅ إضافة معالج لإغلاق القائمة عند الضغط على أي رابط في الناف بار
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const navbarCollapse = document.querySelector(".navbar-collapse");
      const navbarToggler = document.querySelector(".navbar-toggler");

      if (navbarCollapse.classList.contains("show")) {
        navbarToggler.click();
        console.log("[v0] تم إغلاق القائمة بعد الضغط على رابط");
      }
    });
  });
});
