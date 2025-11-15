// ✅ Debounce لتقليل استدعاءات التمرير
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ✅ التعامل مع الشريط العلوي وزر الرجوع للأعلى
const handleScroll = debounce(() => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.background = "rgba(30, 41, 59, 0.98)";
    navbar.style.backdropFilter = "blur(15px)";
    navbar.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
  } else {
    navbar.style.background = "rgba(30, 41, 59, 0.98)";
    navbar.style.backdropFilter = "blur(15px)";
    navbar.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)";
  }

  const scrollToTopBtn = document.getElementById("scrollToTop");
  if (scrollToTopBtn) {
    scrollToTopBtn.classList.toggle("show", window.scrollY > 300);
  }
}, 100);

window.addEventListener("scroll", handleScroll);

const scrollToTopBtn = document.getElementById("scrollToTop");
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", () => {
    console.log("[v0] تم النقر على زر العودة للأعلى");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ✅ Cache للصور
const portfolioCache = {
  data: null,
  timestamp: null,
  duration: 5 * 60 * 1000,
};

let currentPage = 1;
const itemsPerPage = 6;

// ✅ تحميل المعرض
async function loadPortfolioGallery(page = 1) {
  if (page === currentPage && document.querySelector(".portfolio-item")) return;

  const gallery = document.getElementById("portfolioGallery");
  if (!gallery) return;

  try {
    let portfolioImages;
    const now = Date.now();

    if (
      portfolioCache.data &&
      portfolioCache.timestamp &&
      now - portfolioCache.timestamp < portfolioCache.duration
    ) {
      console.log("[v0] استخدام البيانات من الـ Cache");
      portfolioImages = portfolioCache.data;
    } else {
      const response = await fetch(
        "https://project-ahmed-45d30-default-rtdb.firebaseio.com/image.json"
      );
      const data = await response.json();

      if (!data) {
        gallery.innerHTML =
          '<div class="col-12 text-center"><p>لا توجد صور متاحة حالياً</p></div>';
        return;
      }

      portfolioImages = Object.values(data);
      portfolioCache.data = portfolioImages;
      portfolioCache.timestamp = now;
      console.log("[v0] تم حفظ البيانات في الـ Cache");
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedImages = portfolioImages.slice(startIndex, endIndex);
    const totalPages = Math.ceil(portfolioImages.length / itemsPerPage);

    currentPage = page;
    gallery.innerHTML = paginatedImages
      .map(
        (item, index) => `
        <div class="col-md-6 col-lg-4" style="animation-delay: ${index * 0.1}s">
          <div class="portfolio-item">
            <img
              src="${item.imageUrl || item.src}"
              alt="${item.title || "عمل من معرض الأعمال"}"
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
              onerror="this.src='/placeholder.svg?height=400&width=600'"
              onload="this.classList.add('loaded')"
            >
            <div class="portfolio-overlay">
              <h4>${item.title || "مشروع"}</h4>
              <p>${item.description || "حملة إعلانية ناجحة"}</p>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    // ✅ إزالة الترقيم القديم
    const oldPagination = gallery.querySelector(".pagination");
    if (oldPagination) oldPagination.parentElement.remove();

    // ✅ عرض الترقيم
    if (totalPages > 1) {
      const paginationHTML = `
        <div class="col-12">
          <nav aria-label="Portfolio pagination">
            <ul class="pagination justify-content-center mt-4">
              <li class="page-item ${page === 1 ? "disabled" : ""}">
                <a class="page-link" href="#portfolio" data-page="${
                  page - 1
                }">السابق</a>
              </li>
              ${Array.from({ length: totalPages }, (_, i) => i + 1)
                .map(
                  (p) => `
                  <li class="page-item ${p === page ? "active" : ""}">
                    <a class="page-link" href="#portfolio" data-page="${p}">${p}</a>
                  </li>
                `
                )
                .join("")}
              <li class="page-item ${page === totalPages ? "disabled" : ""}">
                <a class="page-link" href="#portfolio" data-page="${
                  page + 1
                }">التالي</a>
              </li>
            </ul>
          </nav>
        </div>
      `;
      gallery.insertAdjacentHTML("beforeend", paginationHTML);

      document.querySelectorAll(".pagination .page-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const newPage = Number.parseInt(e.target.getAttribute("data-page"));
          if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
            loadPortfolioGallery(newPage);
            gallery.scrollIntoView({ behavior: "smooth" });
          }
        });
      });
    }

    applyAnimations();
  } catch (error) {
    console.error("خطأ في تحميل معرض الأعمال:", error);
    gallery.innerHTML =
      '<div class="col-12 text-center"><p class="text-danger">حدث خطأ في تحميل الصور. يرجى المحاولة لاحقاً.</p></div>';
  }
}

// ✅ زر تحديث المعرض
document.getElementById("reloadGalleryBtn").addEventListener("click", () => {
  console.log("[v0] تم الضغط على زر تحديث المعرض");
  loadPortfolioGallery(currentPage);
});

// ✅ إعداد الأنيميشن
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// ✅ تطبيق الأنيميشن
function applyAnimations() {
  const animatedElements = document.querySelectorAll(
    ".portfolio-item, .service-card, .video-category-card, .course-card, .certificate-card, .student-honor-card"
  );
  animatedElements.forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease";
    el.style.animationDelay = `${index * 0.1}s`;
    observer.observe(el);
  });
}

// ✅ Smooth scrolling للروابط
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;
    const target = document.querySelector(targetId);
    if (target) {
      const navbar = document.querySelector(".navbar");
      const navbarHeight = navbar.offsetHeight;
      const targetPosition =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        navbarHeight -
        20;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  });
});

// Track active section and update URL hash
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

function updateActiveSection() {
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      // Update URL hash without scrolling
      if (window.location.hash !== `#${sectionId}`) {
        history.replaceState(null, null, `#${sectionId}`);
      }

      // Update active nav link
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${sectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });
}

// Debounced scroll handler for section tracking
const handleSectionScroll = debounce(() => {
  updateActiveSection();
}, 100);

window.addEventListener("scroll", handleSectionScroll);

// Update on page load if there's a hash
window.addEventListener("load", () => {
  if (window.location.hash) {
    updateActiveSection();
  }
  loadPortfolioGallery(1);
});

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

// ✅ إضافة معالج نموذج الاتصال لإرسال عبر واتساب
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // إنشاء رسالة واتساب
    const whatsappMessage = `مرحباً، أنا ${name}%0A%0Aرقم الهاتف: ${phone}%0Aالبريد الإلكتروني: ${email}%0A%0Aالرسالة:%0A${message}`;

    // فتح واتساب مع الرسالة
    window.open(`https://wa.me/972595317881?text=${whatsappMessage}`, "_blank");

    console.log("[v0] تم إرسال نموذج الاتصال عبر واتساب");
  });
}
