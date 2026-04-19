$(function () {
  // Page-specific initialization
  if ($('#content').length) {
    // Home.html specific
    $('nav a').on('click', function (e) {
      e.preventDefault();
      const page = $(this).data('page');
      loadContent(page);
    });

    // jQuery Effect: Slide toggle for profile detail sections
    $(document).on('click', '.detail-section h3', function () {
      $(this).next().slideToggle();
    });

    // Modal close events
    $(document).on('click', '.close', function() {
      $('#modal').hide();
    });
    $(document).on('click', '#modal', function(e) {
      if (e.target === this) $(this).hide();
    });
  }

  if ($('#signupForm').length) {
    // SignUp.html specific
    initializeSignUp();
  }

  if ($('#postForm').length) {
    // Feed specific (if loaded in modal or something, but for now)
    initializeFeed();
  }

  $(document).ready(function() {
  // Load user profile from localStorage
    const userProfileJSON = localStorage.getItem('userProfile');
    if (userProfileJSON) {
      try {
        const profile = JSON.parse(userProfileJSON);
        const fullName = profile.fullName;
        // Replace the placeholder with the user's full name
        $('h2.UserName').text(fullName);
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }
  });

});

function loadContent(page) {
  if (!page) return;

  // Map page names to filenames
  if (page.toLowerCase() === 'home') {
    showWelcome();
    return;
  }

  $('#content').show();
  $('#welcomeMessage').hide();

  let file = '';
  
  if (page.toLowerCase() === 'feed') {
    file = 'Feed.html';
  } else if (page.toLowerCase() === 'profile') {
    $('#content').html(renderProfileTemplate());
    loadProfileFromStorage();
    return;
  } else if (page.toLowerCase() === 'about') {
    file = 'About.html';
  } else if (page.toLowerCase() === 'signup') {
    // Navigate to signup page directly
    window.location.href = 'SignUp.html';
    return;
  } 
  
  if (file) {
    $('#content').load(file, function(response, status, xhr) {
      if (status === 'error') {
        $('#content').html(`<h1>Error</h1><p>Could not load ${file}: ${xhr.status} ${xhr.statusText}</p>`);
      }
    });
  }
}

function showWelcome() {
  $('#content').hide();
  $('#welcomeMessage').show();
}

function initializeSignUp() {
  if (!$('#signupForm').length) return;

  // Initially hide the live preview
  if ($('#livePreview').length) $('#livePreview').hide();

  // Character count for bio (now word count)
  $('#bio').on('input', function () {
    const text = $(this).val().trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    $('#bioCharCount').text(wordCount);
  });

  // Live Profile Preview (jQuery) - show preview dynamically
  if ($('#previewName').length) {
    $('#fullName').on('input', function() {
      const val = $(this).val();
      $('#previewName').fadeOut(200, function() {
        $(this).text(val).fadeIn(200);
      });
      if (val && $('#livePreview').is(':hidden')) {
        $('#livePreview').slideDown(300);
      }
    });
  }

  if ($('#previewBio').length) {
    $('#bio').on('input', function() {
      const val = $(this).val();
      $('#previewBio').fadeOut(200, function() {
        $(this).text(val).fadeIn(200);
      });
      if (val && $('#livePreview').is(':hidden')) {
        $('#livePreview').slideDown(300);
      }
    });
  }

  if ($('input[name="interests"]').length) {
    $('input[name="interests"]').on('change', function() {
      updatePreviewInterests();
      const interests = getSelectedInterests();
      if (interests.length > 0 && $('#livePreview').is(':hidden')) {
        $('#livePreview').slideDown(300);
      }
    });
  }

  // Form submission
  $('#signupForm').on('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    // Clear previous errors
    $('.error-message').text('');

    // Validate form
    if (validateForm()) {
      // Collect form data
      const formData = {
        fullName: $('#fullName').val().trim(),
        studentNumber: $('#studentNumber').val().trim(),
        campus: $('#campus').val(),
        email: $('#email').val().trim(),
        password: $('#password').val(),
        interests: getSelectedInterests(),
        bio: $('#bio').val().trim()
      };

      // Store in localStorage
      localStorage.setItem('userProfile', JSON.stringify(formData));

      // Redirect to home
      window.location.href = 'Home.html';
    }
  });
}

function updatePreviewInterests() {
  const interests = getSelectedInterests();
  $('#previewInterests').empty();
  interests.forEach(interest => {
    $('#previewInterests').append('<span class="interest-tag">' + interest + '</span>');
  });
}

function initializeFeed() {
  if (!$('#postForm').length) return;

  loadPostsFromStorage();

  $('#postForm').on('submit', function(e) {
    e.preventDefault();
    const content = $('#postContent').val().trim();
    if (content) {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (!userProfile.fullName) {
        alert('Please sign up first!');
        loadContent('signup');
        return;
      }
      const post = {
        username: userProfile.fullName,
        content: content,
        timestamp: new Date().toLocaleString(),
        likes: 0,
        id: Date.now()
      };
      addPostToDOM(post);
      savePost(post);
      $('#postContent').val('');
      // jQuery Effect: Fade-in for new posts
      $('#postsContainer .post').first().hide().fadeIn(500);
    }
  });

  // Event delegation for like and delete
  $(document).on('click', '.like-btn', function() {
    const postId = $(this).closest('.post').data('id');
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(p => p.id == postId);
    if (post) {
      post.likes++;
      $(this).text(`Like (${post.likes})`).toggleClass('liked');
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  });

  $(document).on('click', '.delete-btn', function() {
    if (confirm('Are you sure you want to delete this post?')) {
      const postId = $(this).closest('.post').data('id');
      $(this).closest('.post').fadeOut(300, function() {
        $(this).remove();
      });
      let posts = JSON.parse(localStorage.getItem('posts')) || [];
      posts = posts.filter(p => p.id != postId);
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  });
}

function addPostToDOM(post) {
  $('#postsContainer .empty-placeholder').remove();

  const postHTML = `
    <div class="post" data-id="${post.id}">
      <div class="post-header">
        <span class="username">${post.username}</span>
        <span class="timestamp">${post.timestamp}</span>
      </div>
      <p class="post-content">${post.content}</p>
      <div class="post-actions">
        <button class="like-btn">Like (${post.likes})</button>
        <button class="delete-btn">Delete</button>
      </div>
    </div>
  `;
  $('#postsContainer').prepend(postHTML);
}

function savePost(post) {
  let posts = JSON.parse(localStorage.getItem('posts')) || [];
  posts.push(post);
  localStorage.setItem('posts', JSON.stringify(posts));
}

function loadPostsFromStorage() {
  $('#postsContainer').empty();
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  posts.forEach(post => addPostToDOM(post));
}

function validateForm() {
  let isValid = true;

  // Validate Full Name
  const fullName = $('#fullName').val().trim();
  if (!fullName) {
    showError('fullNameError', 'Full Name is required');
    isValid = false;
  } else if (fullName.length < 3) {
    showError('fullNameError', 'Full Name must be at least 3 characters');
    isValid = false;
  } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
    showError('fullNameError', 'Full Name must contain only letters and spaces');
    isValid = false;
  }

  // Validate Student Number
  const studentNumber = $('#studentNumber').val().trim();
  if (!studentNumber) {
    showError('studentNumberError', 'Student Number is required');
    isValid = false;
  } else if (!/^\d{6,}$/.test(studentNumber)) {
    showError('studentNumberError', 'Student Number must be at least 6 digits');
    isValid = false;
  }

  // Validate Campus
  const campus = $('#campus').val();
  if (!campus) {
    showError('campusError', 'Please select a Campus');
    isValid = false;
  }

  // Validate Email
  const email = $('#email').val().trim();
  if (!email) {
    showError('emailError', 'Email Address is required');
    isValid = false;
  } else if (!validateEmail(email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }

  // Validate Password
  const password = $('#password').val();
  if (!password) {
    showError('passwordError', 'Password is required');
    isValid = false;
  } else if (password.length < 8) {
    showError('passwordError', 'Password must be at least 8 characters');
    isValid = false;
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    showError('passwordError', 'Password must contain uppercase, lowercase, and numbers');
    isValid = false;
  }

  // Validate Interests
  const selectedInterests = getSelectedInterests();
  if (selectedInterests.length === 0) {
    showError('interestsError', 'Please select at least one interest');
    isValid = false;
  }

  // Validate Bio
  const bio = $('#bio').val().trim();
  if (!bio) {
    showError('bioError', 'Short Bio is required');
    isValid = false;
  } else if (bio.length < 10) {
    showError('bioError', 'Bio must be at least 10 characters');
    isValid = false;
  } else if (bio.length > 200) {
    showError('bioError', 'Bio cannot exceed 200 characters');
    isValid = false;
  }

  return isValid;
}

function showError(elementId, message) {
  $('#' + elementId).text(message).addClass('show');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getSelectedInterests() {
  const interests = [];
  $('input[name="interests"]:checked').each(function () {
      interests.push($(this).val());
  });
  return interests;
}

function displayProfileData(profile) {
  $('#profileFullName').text(profile.fullName);
  $('#profileStudentNumber').text('Student ID: ' + profile.studentNumber);
  $('#profileEmail').text(profile.email);
  $('#profileCampus').text(profile.campus);
  $('#profileBio').text(profile.bio);
  displayInterests(profile.interests);
  displayAvatarInitials(profile.fullName);
}

function displayProfileName(profile) {
  $('#profileFullName').text(profile.fullName);
}

function loadProfileFromStorage() {
  const userProfileJSON = localStorage.getItem('userProfile');

  if (!userProfileJSON) {
    $('#content').html(
      '<div class="profile-no-data"><h2>No profile data found</h2><p>Please sign up first to view your profile.</p><a href="SignUp.html">Go to Sign Up</a></div>'
    );
    return;
  }

  try {
    const userProfile = JSON.parse(userProfileJSON);
    if (!$('#profileFullName').length) {
      console.warn('Profile page content not found in #content. Rendering fallback profile view.');
      $('#content').html(renderProfileTemplate());
    }
    displayProfileData(userProfile);
  } catch (error) {
    console.error('Error parsing user profile:', error);
    $('#content').html('<p>Unable to load profile data. Please refresh or sign up again.</p>');
  }
}

function renderProfileTemplate() {
  return `
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <span id="avatarInitials"></span>
        </div>
        <div class="profile-info">
          <h1 id="profileFullName"></h1>
          <p id="profileStudentNumber" class="student-id"></p>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-section">
          <h3>Contact Information</h3>
          <div class="detail-item">
            <span class="label">Email:</span>
            <span id="profileEmail" class="value"></span>
          </div>
          <div class="detail-item">
            <span class="label">Campus / DL:</span>
            <span id="profileCampus" class="value"></span>
          </div>
        </div>

        <div class="detail-section">
          <h3>About</h3>
          <div class="detail-item">
            <span class="label">Bio:</span>
            <p id="profileBio" class="value bio-text"></p>
          </div>
        </div>

        <div class="detail-section">
          <h3>Interests</h3>
          <div id="profileInterests" class="interests-display"></div>
        </div>
      </div>
    </div>
  `;
}

function displayInterests(interests) {
  const interestsContainer = $('#profileInterests');
  interestsContainer.empty();

  if (interests && interests.length > 0) {
    interests.forEach(function (interest) {
      const badge = $('<span class="interest-badge"></span>').text(interest);
      interestsContainer.append(badge);
    });
  }
}

function displayAvatarInitials(fullName) {
  const names = fullName.split(' ');
  let initials = '';

  names.forEach(function (name) {
    if (name.length > 0) {
      initials += name[0].toUpperCase();
    }
  });

  $('#avatarInitials').text(initials);
}

$(document).on('click', '.menu-toggle', function() {
  $('nav ul').toggleClass('show');
});
