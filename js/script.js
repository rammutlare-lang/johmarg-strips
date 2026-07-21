document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // Home hero slideshow — cycles background photos every 3s, continuously
  var heroSlides = document.querySelectorAll('.home-hero-strip .hero-slide');
  if (heroSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var heroIndex = 0;
    setInterval(function () {
      heroSlides[heroIndex].classList.remove('is-active');
      heroIndex = (heroIndex + 1) % heroSlides.length;
      heroSlides[heroIndex].classList.add('is-active');
    }, 3000);
  }

  // Gallery filter
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.getAttribute('data-filter');
      galleryItems.forEach(function (item) {
        if (cat === 'all' || item.getAttribute('data-cat') === cat) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // File upload label
  var uploadBox = document.querySelector('.upload-box');
  var uploadInput = document.querySelector('.upload-input');
  if (uploadBox && uploadInput) {
    uploadBox.addEventListener('click', function () { uploadInput.click(); });
    uploadInput.addEventListener('change', function () {
      var label = uploadBox.querySelector('.upload-text');
      if (uploadInput.files.length && label) {
        label.textContent = uploadInput.files.length + ' file(s) selected';
      }
    });
  }

  // Live form submit -> POSTs to FormSubmit.co (johmargstrips@outlook.com), no backend required
  document.querySelectorAll('form[data-ajax-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'SENDING...';
      }

      function showMessage(text, isError) {
        var existing = form.querySelector('.form-submit-msg');
        if (existing) existing.remove();
        var msg = document.createElement('div');
        msg.className = 'form-submit-msg';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        msg.textContent = text;
        msg.style.cssText = 'background:' + (isError ? '#e05a5a' : '#f5b400') + ';color:' + (isError ? '#fff' : '#111') + ';padding:16px 20px;border-radius:6px;font-weight:700;line-height:1.5;margin-top:16px;';
        form.appendChild(msg);
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(function () { msg.remove(); }, 10000);
      }

      var ajaxUrl = form.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
      var formData = new FormData(form);
      var successMsg = form.getAttribute('data-success-msg') || 'Thank you! Your request has been received. Our team will be in touch shortly.';

      fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Submission failed');
          return response.json();
        })
        .then(function () {
          showMessage(successMsg, false);
          form.reset();
          var uploadLabel = form.querySelector('.upload-text');
          if (uploadLabel) uploadLabel.textContent = 'Drag & drop files here or click to browse';
        })
        .catch(function () {
          showMessage('Sorry, something went wrong sending your request. Please call or WhatsApp us instead.', true);
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        });
    });
  });
});
