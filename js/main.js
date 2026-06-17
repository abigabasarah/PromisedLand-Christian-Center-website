document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const body = document.body;

    function toggleMenu() {
        mobileNav.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        body.classList.toggle('no-scroll');
        mobileMenuBtn.textContent = mobileNav.classList.contains('active') ? '✕' : '☰';
    }

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
        mobileOverlay.addEventListener('click', toggleMenu);

        document.querySelectorAll('.mobile-nav a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') return;

            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // Close mobile menu if open (using the existing variables)
                if (mobileNav) mobileNav.classList.remove('active');
                if (mobileOverlay) mobileOverlay.classList.remove('active');
                if (body) body.classList.remove('no-scroll');
                if (mobileMenuBtn) mobileMenuBtn.textContent = '☰';

                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
//dynamic images
document.addEventListener('DOMContentLoaded', function () {

    const heroImages = [
        'images/about.jpg',
        'images/index.jpg',
        'images/hee.jpg',
        'images/74.jpg',
        'images/76.jpg',
        'images/72.jpg'
    ];

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Create two background layers
    const bg1 = document.createElement('div');
    const bg2 = document.createElement('div');
    bg1.classList.add('hero-bg');
    bg2.classList.add('hero-bg');
    heroSection.prepend(bg2);
    heroSection.prepend(bg1);

    function setLayer(el, src) {
        el.style.background = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${src}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
    }

    let current = 0;
    let activeBg = bg1;
    let inactiveBg = bg2;

    // Set first image immediately
    setLayer(activeBg, heroImages[0]);
    activeBg.style.opacity = '1';
    inactiveBg.style.opacity = '0';

    // Preload all images
    const promises = heroImages.map(src => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
        });
    });

    // Start slideshow after all images are cached
    Promise.all(promises).then(() => {
        setInterval(() => {
            current = (current + 1) % heroImages.length;
            setLayer(inactiveBg, heroImages[current]);
            inactiveBg.style.opacity = '1';
            activeBg.style.opacity = '0';
            [activeBg, inactiveBg] = [inactiveBg, activeBg];
        }, 5000);
    });

});
// Animate home sections on scroll
const homeSections = document.querySelectorAll('#church-section section');
if (homeSections.length > 0) {
    homeSections.forEach((section) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'none';
    });

    setTimeout(() => {
        homeSections.forEach((section, i) => {
            section.style.transition = `opacity 0.7s ease ${i * 0.15}s, transform 0.7s ease ${i * 0.15}s`;
        });

        const homeSectionsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                } else {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(50px)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        homeSections.forEach(section => homeSectionsObserver.observe(section));
    }, 300);
}
// ======================
// Booking Form
// ======================
const serviceTypeSelect = document.getElementById('serviceType');
const dateGroup = document.getElementById('dateGroup');
const preferredDateInput = document.getElementById('preferredDate');
const childNameGroup = document.getElementById('childNameGroup');
const childNameInput = document.getElementById('childName');
const preferredTimeSelect = document.getElementById('preferredTime'); // Add this
const bookingForm = document.getElementById('bookingForm');
const loader = document.getElementById('loader');
const confirmation = document.getElementById('confirmation');

// Only run if elements exist (for pages that have the form)
if (serviceTypeSelect && dateGroup && preferredDateInput) {
    // Set minimum date to today
    const todayDate = new Date().toISOString().split('T')[0];
    preferredDateInput.setAttribute('min', todayDate);
    // Hide date field on page load
    dateGroup.style.display = 'none';
    preferredDateInput.removeAttribute('required');

    // Hide child name field on page load
    if (childNameGroup) {
        childNameGroup.style.display = 'none';
        if (childNameInput) childNameInput.removeAttribute('required');
    }

    // Default time options
    const defaultTimeOptions = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
    ];

    const counsellingTimeOptions = [
        "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM"
    ];

    // Function to update time options
    function updateTimeOptions(options) {
        preferredTimeSelect.innerHTML = '<option value="">Select a time</option>';
        options.forEach(time => {
            const opt = document.createElement('option');
            opt.value = time;
            opt.textContent = time;
            preferredTimeSelect.appendChild(opt);
        });
    }

    // Initialize with default options
    updateTimeOptions(defaultTimeOptions);

    // Handle service type change
    serviceTypeSelect.addEventListener('change', function () {
        if (this.value === 'counselling') {
            // Hide date field for counselling
            dateGroup.style.display = 'none';
            preferredDateInput.removeAttribute('required');
            preferredDateInput.value = '';

            // Hide child name field
            if (childNameGroup) {
                childNameGroup.style.display = 'none';
                if (childNameInput) {
                    childNameInput.removeAttribute('required');
                    childNameInput.value = '';
                }
            }

            // Set counselling-specific times
            updateTimeOptions(counsellingTimeOptions);

        } else if (this.value === 'dedication') {
            // Show both date and child name fields for dedication
            dateGroup.style.display = 'block';
            preferredDateInput.setAttribute('required', 'required');

            if (childNameGroup) {
                childNameGroup.style.display = 'block';
                if (childNameInput) childNameInput.setAttribute('required', 'required');
            }

            // Set default time options
            updateTimeOptions(defaultTimeOptions);

        } else if (this.value !== '') {
            // Show date field for other services
            dateGroup.style.display = 'block';
            preferredDateInput.setAttribute('required', 'required');

            // Hide child name field for other services
            if (childNameGroup) {
                childNameGroup.style.display = 'none';
                if (childNameInput) {
                    childNameInput.removeAttribute('required');
                    childNameInput.value = '';
                }
            }

            // Set default time options
            updateTimeOptions(defaultTimeOptions);

        } else {
            // Hide if no service selected
            dateGroup.style.display = 'none';
            preferredDateInput.removeAttribute('required');

            if (childNameGroup) {
                childNameGroup.style.display = 'none';
                if (childNameInput) childNameInput.removeAttribute('required');
            }

            // Reset to default times
            updateTimeOptions(defaultTimeOptions);
        }
    });
}
// Handle form submission
if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault(); // STOP page redirect
        // Phone validation
        const phoneInput = bookingForm.querySelector('[name="phone"]');
        const phoneError = document.getElementById('phoneError');
        const phone = phoneInput.value.trim();
        if (phone && (!/^0\d{9}$/.test(phone))) {
            phoneError.style.display = 'block';
            phoneInput.focus();
            return;
        } else {
            phoneError.style.display = 'none';
        }
        // Show loader
        bookingForm.style.display = 'none';
        loader.style.display = 'block';

        // Collect form data
        const formData = new FormData(bookingForm);

        // Send AJAX request to PHP
        fetch('submit_booking.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.text())
            .then(data => {
                // Hide loader
                loader.style.display = 'none';

                // If PHP returns "SUCCESS", show success message
                if (data.trim() === "SUCCESS") {
                    confirmation.style.display = 'block';
                    confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Reset/restore form after 5 seconds
                    setTimeout(function () {
                        bookingForm.reset();
                        confirmation.style.display = 'none';
                        bookingForm.style.display = 'block';

                        // Hide date field again for counselling
                        if (dateGroup) dateGroup.style.display = 'none';
                        if (preferredDateInput) preferredDateInput.removeAttribute('required');

                        // Hide child name field again
                        if (childNameGroup) {
                            childNameGroup.style.display = 'none';
                            if (childNameInput) childNameInput.removeAttribute('required');
                        }

                    }, 5000);
                } else {
                    // Show PHP error message
                    alert("Error: " + data);
                    bookingForm.style.display = 'block';
                }
            })
            .catch(error => {
                loader.style.display = 'none';
                alert("Submission failed.");
                bookingForm.style.display = 'block';
            });
    });
}
// Leaders Slideshow
let leaderIndex = 0;
const leaderSlides = document.querySelectorAll('.leader-slide');
const leaderDots = document.querySelectorAll('.leaders-slideshow .dot');

function goToLeader(index) {
    if (!leaderSlides[index] || !leaderDots[index]) return;
    leaderSlides[leaderIndex].classList.remove('active');
    leaderDots[leaderIndex].classList.remove('active');
    leaderIndex = index;
    leaderSlides[leaderIndex].classList.add('active');
    leaderDots[leaderIndex].classList.add('active');
}

if (leaderSlides.length > 0) {
    setInterval(() => {
        goToLeader((leaderIndex + 1) % leaderSlides.length);
    }, 4000);
}

// Testimony Slideshow
let testimonyIndex = 0;
const testimonySlides = document.querySelectorAll('.testimony-slide');
const testimonyDots = document.querySelectorAll('.testimony-slideshow .dot');

function goToTestimony(index) {
    if (!testimonySlides[index] || !testimonyDots[index]) return;
    testimonySlides[testimonyIndex].classList.remove('active');
    testimonyDots[testimonyIndex].classList.remove('active');
    testimonyIndex = index;
    testimonySlides[testimonyIndex].classList.add('active');
    testimonyDots[testimonyIndex].classList.add('active');
}

if (testimonySlides.length > 0) {
    setInterval(() => {
        goToTestimony((testimonyIndex + 1) % testimonySlides.length);
    }, 20000);
}
//about read more
function toggleText(btn) {
    const shortText = btn.previousElementSibling.querySelector('.short-text');
    const fullText = btn.previousElementSibling.querySelector('.full-text');

    if (fullText.style.display === 'none') {
        fullText.style.display = 'inline';
        shortText.style.display = 'none';
        btn.textContent = 'Show less';
    } else {
        fullText.style.display = 'none';
        shortText.style.display = 'inline';
        btn.textContent = 'Read more';
    }
}
// Gallery Card Slideshows
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.gallery-item').forEach(item => {
        const slides = item.querySelectorAll('.card-slide');
        const overlaySpan = item.querySelector('.gallery-overlay span');
        if (slides.length <= 1) return;
        let index = 0;
        setInterval(() => {
            slides[index].classList.remove('active');
            index = (index + 1) % slides.length;
            slides[index].classList.add('active');
            overlaySpan.textContent = slides[index].getAttribute('data-label');
        }, 3000);
    });
});
//bouncing
document.querySelectorAll('.icon-btn').forEach(btn => {
    document.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const distance = 80; // how close in pixels before it bounces

        const nearX = e.clientX >= rect.left - distance && e.clientX <= rect.right + distance;
        const nearY = e.clientY >= rect.top - distance && e.clientY <= rect.bottom + distance;

        if (nearX && nearY) {
            btn.classList.add('bouncing');
            setTimeout(() => btn.classList.remove('bouncing'), 600);
        }
    });
});
// ======================
// Events Calendar
// ======================
if (document.getElementById('calendar')) {
    generateCalendar();
}

const prevMonthBtn = document.getElementById('prev-month');
if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function () {
        console.log('Previous month');
        // Implement actual month change logic
    });
}

const nextMonthBtn = document.getElementById('next-month');
if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function () {
        console.log('Next month');
        // Implement actual month change logic
    });
}

// ======================
// Sermon Filtering
// ======================
if (document.getElementById('series-filter')) {
    const sermonItems = document.querySelectorAll('.sermon-item');

    document.querySelectorAll('.filter-options select').forEach(select => {
        select.addEventListener('change', function () {
            const seriesFilter = document.getElementById('series-filter').value;
            const speakerFilter = document.getElementById('speaker-filter').value;
            const dateFilter = document.getElementById('date-filter').value;

            sermonItems.forEach(item => {
                const matchesSeries = seriesFilter === 'all' || item.dataset.series === seriesFilter;
                const matchesSpeaker = speakerFilter === 'all' || item.dataset.speaker === speakerFilter;
                const matchesDate = dateFilter === 'all' || true; // Simplified for demo

                item.style.display = (matchesSeries && matchesSpeaker && matchesDate) ? 'flex' : 'none';
            });
        });
    });
}
// ======================
// Animate Steps on Scroll
// ======================
const steps = document.querySelectorAll('.step');
if (steps.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 200);
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });


    steps.forEach(step => observer.observe(step));
}
// ======================
// Contact Form
// ======================
const contactForm = document.getElementById('contactForm');
const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phoneError');

function validatePhone() {
    const phonePattern = /^0\d{9}$/;
    const value = phoneInput.value.trim();

    if (value === '' || !phonePattern.test(value)) {
        phoneError.style.display = 'block';
        return false;
    } else {
        phoneError.style.display = 'none';
        return true;
    }
}

if (phoneInput) {
    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('input', () => {
        if (phoneError.style.display === 'block') {
            validatePhone();
        }
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent page reload

        // Stop here if phone is invalid
        if (!validatePhone()) {
            return;
        }

        const formData = new FormData(this);
        const successMessage = document.getElementById('successMessage');
        const messageText = successMessage.querySelector('.message-text');

        try {
            const response = await fetch('submit_contact.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Add checkmark dynamically
                messageText.innerHTML = '✔ ' + result.message;

                // Fade in
                successMessage.classList.add('show');
                successMessage.classList.remove('hide');

                this.reset(); // Clear form fields

                // Fade out after 5 seconds
                setTimeout(() => {
                    successMessage.classList.remove('show');
                    successMessage.classList.add('hide');
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 500); // Matches CSS transition duration
                }, 5000);
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Network error: ' + error.message);
        }
    });
}
//text area on give form
const fundSelect = document.getElementById('fund');
if (fundSelect) {
    fundSelect.addEventListener('change', function () {
        const otherGroup = document.getElementById('other-fund-group');
        const otherTextarea = document.getElementById('other-fund');

        if (this.value === 'Other') {
            otherGroup.style.display = 'block';
            otherTextarea.required = true;
        } else {
            otherGroup.style.display = 'none';
            otherTextarea.required = false;
            otherTextarea.value = '';
        }
    });
}
// ======================
// Giving Page - RukaPay (server-verified flow)
// ======================
//
// Key difference from the old Flutterwave version:
// The browser NEVER declares a donation successful on its own. It submits
// the form to create_payment.php, then polls check_status.php, which only
// ever reflects what webhook.php has recorded after RukaPay itself confirms
// payment. This closes the gap where someone could fake a "success" callback
// in their browser console and have it recorded as a real donation.

const givingForm = document.getElementById("givingForm");

if (givingForm) {
    givingForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const amount = document.getElementById("amount").value;
        const fund = document.getElementById("fund").value;
        const otherFund = document.getElementById("other-fund")?.value || "";
        const name = document.getElementById("donor-name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("donor-phone").value;
        const anonymous = document.getElementById("anonymous").checked;

        // ---- Client-side validation (still needed for UX, but the server re-validates everything) ----
        if (!amount || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!fund || fund === "Select contribution") {
            alert("Please select a contribution type.");
            return;
        }
        if (fund === "Other" && !otherFund.trim()) {
            alert("Please specify what this contribution is for.");
            return;
        }
        if (!name || !phone) {
            alert("Please fill in all required fields.");
            return;
        }

        const submitButton = givingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('fund', fund);
        formData.append('other_fund', otherFund);
        formData.append('donor_name', name);
        formData.append('donor_email', email);
        formData.append('donor_phone', phone);
        formData.append('anonymous', anonymous ? 'true' : 'false');

        fetch('create_payment.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    alert(data.message || "Something went wrong. Please try again.");
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                    return;
                }

                // If RukaPay needs the user to be redirected to complete payment
                // (e.g. a hosted checkout page), send them there.
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                    return;
                }

                // Otherwise, assume a mobile money push was sent to their phone.
                // Show a "waiting for confirmation" state and poll for the real result.
                showWaitingState(amount, fund);
                pollDonationStatus(data.reference, amount, fund);
            })
            .catch(error => {
                console.error('Error creating payment:', error);
                alert("Could not connect to the server. Please check your connection and try again.");
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
    });
}

function showWaitingState(amount, fund) {
    givingForm.style.display = 'none';

    const waitingMessage = document.createElement('div');
    waitingMessage.className = 'waiting-message';
    waitingMessage.id = 'waitingMessage';
    waitingMessage.innerHTML = `
        <div class="spinner-icon"><i class="fas fa-spinner fa-spin"></i></div>
        <h2>Confirming Your Payment...</h2>
        <p>Please check your phone and approve the mobile money prompt.</p>
        <p>Amount: <strong>UGX ${parseInt(amount).toLocaleString()}</strong> to <strong>${fund}</strong></p>
        <p style="color:#666; font-size: 0.9em;">This page will update automatically once payment is confirmed.</p>
    `;
    givingForm.parentNode.insertBefore(waitingMessage, givingForm.nextSibling);
    waitingMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Polls check_status.php until the server-confirmed status is no longer
 * "pending". Stops after a reasonable timeout so users aren't stuck forever
 * if something goes wrong.
 */
function pollDonationStatus(reference, amount, fund, attempt = 0) {
    const MAX_ATTEMPTS = 30;   // ~2.5 minutes at 5s intervals
    const POLL_INTERVAL_MS = 5000;

    if (attempt >= MAX_ATTEMPTS) {
        showTimeoutState(reference);
        return;
    }

    fetch(`check_status.php?reference=${encodeURIComponent(reference)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                // Keep polling - transient errors shouldn't kill the flow immediately.
                setTimeout(() => pollDonationStatus(reference, amount, fund, attempt + 1), POLL_INTERVAL_MS);
                return;
            }

            if (data.status === 'completed') {
                showThankYouMessage(reference, data.amount, data.fund_type);
            } else if (data.status === 'failed') {
                showFailedState();
            } else {
                // Still pending - keep polling.
                setTimeout(() => pollDonationStatus(reference, amount, fund, attempt + 1), POLL_INTERVAL_MS);
            }
        })
        .catch(error => {
            console.error('Error checking status:', error);
            setTimeout(() => pollDonationStatus(reference, amount, fund, attempt + 1), POLL_INTERVAL_MS);
        });
}

function showThankYouMessage(reference, amount, fund) {
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) waitingMessage.remove();

    const thankYouMessage = document.createElement('div');
    thankYouMessage.className = 'thank-you-message';
    thankYouMessage.innerHTML = `
        <div class="success-icon">✓</div>
        <h2>Thank You for Your Generosity!</h2>
        <p>Your donation of <strong>UGX ${parseInt(amount).toLocaleString()}</strong> to <strong>${fund}</strong> has been received.</p>
        <p>Transaction Reference: <strong>${reference}</strong></p>
        <p class="blessing">May God bless you abundantly for your faithful giving!</p>
        <button onclick="location.reload()" class="cta-button">Make Another Donation</button>
    `;
    givingForm.parentNode.insertBefore(thankYouMessage, givingForm.nextSibling);
    thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFailedState() {
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) waitingMessage.remove();

    const failedMessage = document.createElement('div');
    failedMessage.className = 'failed-message';
    failedMessage.innerHTML = `
        <div class="failed-icon">✗</div>
        <h2>Payment Not Completed</h2>
        <p>It looks like the payment wasn't approved or didn't go through.</p>
        <button onclick="location.reload()" class="cta-button">Try Again</button>
    `;
    givingForm.parentNode.insertBefore(failedMessage, givingForm.nextSibling);
    failedMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showTimeoutState(reference) {
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) waitingMessage.remove();

    const timeoutMessage = document.createElement('div');
    timeoutMessage.className = 'timeout-message';
    timeoutMessage.innerHTML = `
        <h2>Still Waiting...</h2>
        <p>We haven't received confirmation yet. If you completed the payment on your phone,
           it may just be taking a little longer than usual - your donation will still be recorded
           once confirmed.</p>
        <p>Your reference number is: <strong>${reference}</strong></p>
        <p>If you're unsure, please contact the church office with this reference.</p>
        <button onclick="location.reload()" class="cta-button">Back to Giving Page</button>
    `;
    givingForm.parentNode.insertBefore(timeoutMessage, givingForm.nextSibling);
    timeoutMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ======================
// New Here Page (FAQ)
// ======================
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isOpen = question.classList.contains('active');

        // Close all other FAQs
        document.querySelectorAll('.faq-question').forEach(q => {
            if (q !== question) {
                q.classList.remove('active');
                q.nextElementSibling.classList.remove('show');
            }
        });

        // Toggle current FAQ
        question.classList.toggle('active');
        answer.classList.toggle('show');
    });
});

const visitForm = document.querySelector('.visit-form');
if (visitForm) {
    visitForm.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Thank you for letting us know you\'re coming! We look forward to meeting you.');
        this.reset();
    });
}

// ======================
// Calendar Generation
// ======================
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    const currentMonth = document.getElementById('current-month');
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    // Set month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    if (currentMonth) {
        currentMonth.textContent = `${monthNames[month]} ${year}`;
    }

    // Clear existing calendar
    calendar.innerHTML = '';

    // Create day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Create calendar cells
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells for days before 1st
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        // Add sample events (replace with real data)
        if (day === 15) {
            const event = document.createElement('div');
            event.className = 'calendar-event';
            event.textContent = 'VBS Starts';
            dayCell.appendChild(event);
        }

        calendar.appendChild(dayCell);
    }
}