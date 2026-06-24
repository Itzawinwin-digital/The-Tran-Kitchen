document.addEventListener('DOMContentLoaded', () => {
    const languageButtons = document.querySelectorAll('[data-language-switch]');
    const translatedNodes = document.querySelectorAll('[data-i18n], [data-i18n-html]');
    const translatedPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
    const translationScript = document.getElementById('site-translations');
    const carouselRoots = document.querySelectorAll('[data-carousel]');
    const inquiryForm = document.getElementById('inquiryForm');
    const translations = translationScript ? JSON.parse(translationScript.textContent) : null;

    const applyTranslations = (language) => {
        const dictionary = translations && translations[language] ? translations[language] : null;

        localStorage.setItem('tran-kitchen-language', language);
        document.documentElement.lang = language;

        if (dictionary) {
            if (dictionary['document.title']) {
                document.title = dictionary['document.title'];
            }

            translatedNodes.forEach((node) => {
                const key = node.dataset.i18nHtml || node.dataset.i18n;
                const value = dictionary[key];

                if (value !== undefined) {
                    if (node.dataset.i18nHtml) {
                        node.innerHTML = value;
                    } else {
                        node.textContent = value;
                    }
                }
            });

            translatedPlaceholders.forEach((field) => {
                const key = field.dataset.i18nPlaceholder;
                const value = dictionary[key];

                if (value !== undefined) {
                    field.placeholder = value;
                }
            });
        }

        languageButtons.forEach((button) => {
            const isActive = button.dataset.languageSwitch === language;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    const savedLanguage = localStorage.getItem('tran-kitchen-language') || 'en';
    applyTranslations(savedLanguage);

    languageButtons.forEach((button) => {
        button.addEventListener('click', () => applyTranslations(button.dataset.languageSwitch));
    });

    carouselRoots.forEach((root) => {
        const track = root.querySelector('[data-carousel-track]');
        const prevButton = root.querySelector('[data-carousel-prev]');
        const nextButton = root.querySelector('[data-carousel-next]');
        const slides = Array.from(track ? track.children : []);

        if (!track || slides.length === 0) {
            return;
        }

        const scrollBySlide = (direction) => {
            const slide = slides[0];
            const slideWidth = slide.getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
            const offset = slideWidth + gap;
            const maxScrollLeft = track.scrollWidth - track.clientWidth;
            const nextLeft = direction > 0 ? track.scrollLeft + offset : track.scrollLeft - offset;

            if (direction > 0 && nextLeft >= maxScrollLeft - 2) {
                track.scrollLeft = 0;
                return;
            }

            if (direction < 0 && track.scrollLeft <= 2) {
                track.scrollLeft = maxScrollLeft;
                return;
            }

            track.scrollLeft = nextLeft;
        };

        let autoPlayId = window.setInterval(() => scrollBySlide(1), 3500);
        const pauseAutoPlay = () => window.clearInterval(autoPlayId);
        const resumeAutoPlay = () => {
            pauseAutoPlay();
            autoPlayId = window.setInterval(() => scrollBySlide(1), 3500);
        };

        prevButton?.addEventListener('click', () => {
            scrollBySlide(-1);
            resumeAutoPlay();
        });

        nextButton?.addEventListener('click', () => {
            scrollBySlide(1);
            resumeAutoPlay();
        });

        root.addEventListener('mouseenter', pauseAutoPlay);
        root.addEventListener('mouseleave', resumeAutoPlay);
        root.addEventListener('focusin', pauseAutoPlay);
        root.addEventListener('focusout', resumeAutoPlay);
    });

    if (inquiryForm) {
        inquiryForm.addEventListener('submit', (e) => {
            // Prevent the page from reloading
            e.preventDefault();
            
            // In a real application, you would send this data to a server here.
            const isVietnamese = document.documentElement.lang === 'vi';
            alert(isVietnamese
                ? 'Cảm ơn bạn! Yêu cầu của bạn đã được gửi đến The Tran\'s Kitchen. Chúng tôi sẽ liên hệ sớm.'
                : "Thank you! Your inquiry has been sent to The Tran's Kitchen. We will be in touch shortly.");
            
            // Clear the form
            inquiryForm.reset();
        });
    }
});