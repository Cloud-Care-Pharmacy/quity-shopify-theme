class PatientIntakeForm extends HTMLElement {
  constructor() {
    super();
    
    this.currentStep = 1;
    this.totalSteps = 6;
    this.formData = {};
    
    this.form = this.querySelector('#patientIntakeForm');
    this.steps = this.querySelectorAll('.form-step');
    this.btnNext = this.querySelector('#btnNext');
    this.btnBack = this.querySelector('#btnBack');
    this.btnSubmit = this.querySelector('#btnSubmit');
    this.stepsList = this.querySelector('#stepsList');
    this.stepItems = this.querySelectorAll('.step-item');
    this.successMessage = this.querySelector('#successMessage');
    this.errorBanner = this.querySelector('#formErrorBanner');
    this.completedSteps = new Set();
    this.uploadedFile = null;
    
    this.init();
  }

  init() {
    console.log('🔧 PatientIntakeForm initialized');
    // Each step is isolated so a failure in one (e.g. restoring real
    // session/account data) can never prevent the brand dropdowns and the
    // date picker from being wired up.
    const safe = (label, fn) => {
      try { fn(); } catch (e) { console.error('[intake] ' + label + ' failed:', e); }
    };
    safe('loadFromSession', () => this.loadFromSession());
    safe('updateDisplay', () => this.updateDisplay());
    safe('bindEvents', () => this.bindEvents());
    safe('restoreFormData', () => this.restoreFormData());
    safe('initBrandControls', () => this.initBrandControls());
  }

  bindEvents() {
    console.log('🔗 Binding events...');
    
    // Next button
    this.btnNext.addEventListener('click', () => {
      console.log('👉 Next button clicked');
      this.nextStep();
    });
    
    // Back button
    this.btnBack.addEventListener('click', () => {
      console.log('👈 Back button clicked');
      this.prevStep();
    });
    
    // Form submit
    this.form.addEventListener('submit', (e) => {
      console.log('📤 Form submit triggered');
      this.handleSubmit(e);
    });
    
    // Save to session on input
    this.form.addEventListener('input', () => {
      console.log('💾 Auto-saving to session...');
      this.saveToSession();
    });
    
    // Click on completed steps to navigate
    this.stepItems.forEach(stepItem => {
      stepItem.addEventListener('click', () => {
        const targetStep = parseInt(stepItem.dataset.step);
        if (this.completedSteps.has(targetStep) && targetStep !== this.currentStep) {
          this.navigateToStep(targetStep);
        }
      });
    });
    
    // Quit methods mutual exclusivity: "not-tried" vs other options
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'quitMethods') {
        const allQuitMethods = this.form.querySelectorAll('input[name="quitMethods"]');
        if (e.target.value === 'not-tried' && e.target.checked) {
          // Uncheck all others
          allQuitMethods.forEach(cb => {
            if (cb.value !== 'not-tried') {
              cb.checked = false;
              const parent = cb.closest('.checkbox-option');
              if (parent) parent.classList.remove('selected');
            }
          });
        } else if (e.target.value !== 'not-tried' && e.target.checked) {
          // Uncheck "not-tried"
          const notTried = this.form.querySelector('input[name="quitMethods"][value="not-tried"]');
          if (notTried) {
            notTried.checked = false;
            const parent = notTried.closest('.checkbox-option');
            if (parent) parent.classList.remove('selected');
          }
        }
      }
    });

    // Medications conditional visibility
    this.form.querySelectorAll('input[name="takesMedication"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const medicationsGroup = this.querySelector('#medicationsListGroup');
        const medicationsTextGroup = this.querySelector('#medicationsTextGroup');
        const medicationsTextarea = this.querySelector('#medicationsList');
        if (radio.value === 'yes' && radio.checked) {
          medicationsGroup.style.display = '';
        } else if (radio.value === 'no' && radio.checked) {
          medicationsGroup.style.display = 'none';
          medicationsTextGroup.style.display = 'none';
          medicationsTextarea.removeAttribute('required');
          medicationsTextarea.value = '';
          medicationsTextarea.classList.remove('error');
          const errorMsg = medicationsTextGroup.querySelector('.error-message');
          if (errorMsg) errorMsg.classList.remove('show');
          // Uncheck high-risk medications
          this.form.querySelectorAll('input[name="highRiskMedications"]').forEach(cb => {
            cb.checked = false;
            const parent = cb.closest('.checkbox-option');
            if (parent) parent.classList.remove('selected');
          });
        }
      });
    });

    // High-risk medications "other" toggle — show/hide free-text
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'highRiskMedications' && e.target.value === 'other') {
        const medicationsTextGroup = this.querySelector('#medicationsTextGroup');
        const medicationsTextarea = this.querySelector('#medicationsList');
        if (e.target.checked) {
          medicationsTextGroup.style.display = '';
          medicationsTextarea.setAttribute('required', '');
        } else {
          medicationsTextGroup.style.display = 'none';
          medicationsTextarea.removeAttribute('required');
          medicationsTextarea.value = '';
          medicationsTextarea.classList.remove('error');
          const errMsg = medicationsTextGroup.querySelector('.error-message');
          if (errMsg) errMsg.classList.remove('show');
        }
      }
    });

    // Medical conditions conditional visibility
    this.form.querySelectorAll('input[name="hasMedicalConditions"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const conditionsGroup = this.querySelector('#medicalConditionsGroup');
        if (radio.value === 'yes' && radio.checked) {
          conditionsGroup.style.display = '';
        } else if (radio.value === 'no' && radio.checked) {
          conditionsGroup.style.display = 'none';
          // Uncheck all conditions
          this.form.querySelectorAll('input[name="medicalConditions"]').forEach(cb => {
            cb.checked = false;
            const parent = cb.closest('.checkbox-option');
            if (parent) parent.classList.remove('selected');
          });
          // Hide and clear "other" text
          const otherGroup = this.querySelector('#medicalConditionsOtherGroup');
          const otherTextarea = this.querySelector('#medicalConditionsOther');
          if (otherGroup) otherGroup.style.display = 'none';
          if (otherTextarea) {
            otherTextarea.value = '';
            otherTextarea.removeAttribute('required');
            otherTextarea.classList.remove('error');
          }
        }
      });
    });

    // Medical conditions "other" toggle
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'medicalConditions' && e.target.value === 'other') {
        const otherGroup = this.querySelector('#medicalConditionsOtherGroup');
        const otherTextarea = this.querySelector('#medicalConditionsOther');
        if (e.target.checked) {
          otherGroup.style.display = '';
          otherTextarea.setAttribute('required', '');
        } else {
          otherGroup.style.display = 'none';
          otherTextarea.removeAttribute('required');
          otherTextarea.value = '';
          otherTextarea.classList.remove('error');
          const errMsg = otherGroup.querySelector('.error-message');
          if (errMsg) errMsg.classList.remove('show');
        }
      }
    });

    // File upload handling
    this.bindFileUpload();

    // Medicare Expiry: auto-format MM/YYYY
    const expiryInput = this.form.querySelector('#medicareExpiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', () => {
        let val = expiryInput.value.replace(/[^0-9]/g, '');
        if (val.length > 2) {
          val = val.slice(0, 2) + '/' + val.slice(2, 6);
        }
        expiryInput.value = val;
      });
    }

    // Medicare IRN: restrict to digits 1-9 only
    const irnInput = this.form.querySelector('#medicareIRN');
    if (irnInput) {
      irnInput.addEventListener('input', () => {
        irnInput.value = irnInput.value.replace(/[^1-9]/g, '').slice(0, 1);
      });
    }

    // "I don't know" checkboxes for vaping strength and volume
    this.bindIdkCheckbox('idkVapingStrength', 'vapingStrength');
    this.bindIdkCheckbox('idkVapingVolume', 'vapingVolume');

    // Radio/checkbox option styling
    this.querySelectorAll('.radio-option, .checkbox-option, .radio-card, .checkbox-standalone').forEach(option => {
      option.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const input = option.querySelector('input');
          if (input) {
            if (input.type === 'radio') {
              input.checked = true;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (input.type === 'checkbox') {
              input.checked = !input.checked;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      });
    });
    
    // Update radio/checkbox styling on change
    this.form.addEventListener('change', (e) => {
      if (e.target.type === 'radio') {
        const name = e.target.name;
        this.querySelectorAll(`input[name="${name}"]`).forEach(input => {
          const parent = input.closest('.radio-option, .radio-card');
          if (parent) {
            parent.classList.toggle('selected', input.checked);
          }
        });
      } else if (e.target.type === 'checkbox') {
        const parent = e.target.closest('.checkbox-option, .checkbox-standalone');
        if (parent) {
          parent.classList.toggle('selected', e.target.checked);
        }
      }
    });
  }

  nextStep() {
    console.log('➡️ Attempting to move to next step from step', this.currentStep);
    
    if (!this.validateCurrentStep()) {
      console.log('❌ Validation failed for step', this.currentStep);
      return;
    }
    
    console.log('✅ Validation passed for step', this.currentStep);
    
    // Mark current step as completed
    this.completedSteps.add(this.currentStep);
    console.log('✓ Completed steps:', Array.from(this.completedSteps));
    
    // Check conditional logic
    if (this.currentStep === 2) {
      const smokingStatus = this.form.elements['smokingStatus'].value;
      console.log('🚬 Smoking status:', smokingStatus);
      if (smokingStatus === 'never-smoked-or-vaped') {
        this.currentStep = 4; // Skip step 3
        console.log('⏭️ Skipping step 3, moving to step 4');
      } else {
        this.currentStep++;
      }
    } else if (this.currentStep === 4) {
      const vapingStatus = this.form.elements['vapingStatus'].value;
      console.log('💨 Vaping status:', vapingStatus);
      if (vapingStatus === 'no') {
        this.currentStep = 6; // Skip step 5
        console.log('⏭️ Skipping step 5, moving to step 6');
      } else {
        this.currentStep++;
      }
    } else {
      this.currentStep++;
    }
    
    console.log('📍 New step:', this.currentStep);
    this.updateDisplay();
    this.scrollToTop();
  }

  prevStep() {
    console.log('⬅️ Moving back from step', this.currentStep);
    
    // Check conditional logic for back navigation
    if (this.currentStep === 4) {
      const smokingStatus = this.form.elements['smokingStatus']?.value;
      if (smokingStatus === 'never-smoked-or-vaped') {
        this.currentStep = 2; // Skip step 3
        console.log('⏮️ Skipping step 3, moving to step 2');
      } else {
        this.currentStep--;
      }
    } else if (this.currentStep === 6) {
      const vapingStatus = this.form.elements['vapingStatus']?.value;
      if (vapingStatus === 'no') {
        this.currentStep = 4; // Skip step 5
        console.log('⏮️ Skipping step 5, moving to step 4');
      } else {
        this.currentStep--;
      }
    } else {
      this.currentStep--;
    }
    
    console.log('📍 New step:', this.currentStep);
    this.updateDisplay();
    this.scrollToTop();
  }

  validateCurrentStep() {
    console.log('🔍 Validating step', this.currentStep);
    
    const currentStepElement = this.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    console.log('📋 Found', requiredFields.length, 'required fields');
    
    // Clear previous errors
    currentStepElement.querySelectorAll('.error-message').forEach(msg => {
      msg.classList.remove('show');
    });
    currentStepElement.querySelectorAll('.field__input, .form-control').forEach(field => {
      field.classList.remove('error');
    });
    
    requiredFields.forEach((field, index) => {
      let fieldValid = true;
      const fieldName = field.name || field.id;
      
      console.log(`  Field ${index + 1}: ${fieldName} (${field.type})`);
      
      if (field.type === 'radio') {
        const radioGroup = currentStepElement.querySelectorAll(`input[name="${field.name}"]`);
        const isChecked = Array.from(radioGroup).some(radio => radio.checked);
        console.log(`    ⚪ Radio group checked:`, isChecked);
        if (!isChecked) {
          fieldValid = false;
          const formGroup = field.closest('.field') || field.closest('.form-group');
          const errorMsg = formGroup?.querySelector('.error-message');
          if (errorMsg) {
            errorMsg.classList.add('show');
            console.log('    ❌ Error message shown');
          }
        }
      } else if (field.type === 'checkbox' && field.name === 'safetyAcknowledgment') {
        console.log(`    ☑️ Checkbox checked:`, field.checked);
        if (!field.checked) {
          fieldValid = false;
          const formGroup = field.closest('.field') || field.closest('.form-group');
          const errorMsg = formGroup?.querySelector('.error-message');
          if (errorMsg) {
            errorMsg.classList.add('show');
            console.log('    ❌ Error message shown');
          }
        }
      } else if (field.name === 'quitMethods' || field.name === 'quitMotivation') {
        const checkboxes = currentStepElement.querySelectorAll(`input[name="${field.name}"]`);
        const isAnyChecked = Array.from(checkboxes).some(cb => cb.checked);
        console.log(`    ☑️ At least one ${field.name} checkbox checked:`, isAnyChecked);
        if (!isAnyChecked) {
          fieldValid = false;
          const formGroup = field.closest('.field') || field.closest('.form-group');
          const errorMsg = formGroup?.querySelector('.error-message');
          if (errorMsg) {
            errorMsg.classList.add('show');
            console.log('    ❌ Error message shown');
          }
        }
      } else if (field.value.trim() === '') {
        console.log(`    ⚠️ Field is empty`);
        fieldValid = false;
        field.classList.add('error');
        const formGroup = field.closest('.field') || field.closest('.form-group');
        const errorMsg = formGroup?.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.classList.add('show');
          console.log('    ❌ Error message shown');
        }
      } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
        console.log(`    ⚠️ Invalid email format:`, field.value);
        fieldValid = false;
        field.classList.add('error');
        const formGroup = field.closest('.field') || field.closest('.form-group');
        const errorMsg = formGroup?.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.classList.add('show');
          console.log('    ❌ Error message shown');
        }
      } else {
        console.log(`    ✅ Field valid, value:`, field.value.substring(0, 20) + (field.value.length > 20 ? '...' : ''));
      }
      
      // Special validation for date of birth
      if (this.currentStep === 1 && field.id === 'dob') {
        const dobValue = field.value;
        if (dobValue) {
          const parts = dobValue.split('-');
          const age = this.calculateAge(parts[0], parts[1], parts[2]);
          console.log(`    🎂 Age calculated:`, age);
          if (age < 18) {
            console.log(`    ❌ Age validation failed: under 18`);
            fieldValid = false;
            field.classList.add('error');
            const formGroup = field.closest('.field') || field.closest('.form-group');
            const errorMsg = formGroup?.querySelector('.error-message');
            if (errorMsg) errorMsg.classList.add('show');
          }
        }
      }
      
      if (!fieldValid) {
        isValid = false;
        console.log(`    ❌ Field "${fieldName}" is invalid`);
      } else {
        console.log(`    ✅ Field "${fieldName}" is valid`);
      }
    });
    
    // Validate proof of age file upload (step 1 only)
    if (this.currentStep === 1) {
      const fileInput = this.form.querySelector('#proofOfAge');
      if (fileInput && !this.uploadedFile) {
        isValid = false;
        const formGroup = fileInput.closest('.field') || fileInput.closest('.form-group');
        const errorMsg = formGroup?.querySelector('.error-message');
        if (errorMsg) errorMsg.classList.add('show');
        const uploadZone = this.querySelector('#fileUploadZone');
        if (uploadZone) uploadZone.classList.add('error');
      }
    }

    // Validate Medicare IRN if provided (step 1 only)
    if (this.currentStep === 1) {
      const irnField = this.form.querySelector('#medicareIRN');
      if (irnField && irnField.value.trim() !== '') {
        if (!/^[1-9]$/.test(irnField.value.trim())) {
          isValid = false;
          irnField.classList.add('error');
          const irnGroup = irnField.closest('.form-group');
          const errMsg = irnGroup?.querySelector('.error-message');
          if (errMsg) errMsg.classList.add('show');
        }
      }
    }

    // Validate Medicare Expiry if provided (step 1 only)
    if (this.currentStep === 1) {
      const expiryField = this.form.querySelector('#medicareExpiry');
      if (expiryField && expiryField.value.trim() !== '') {
        if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(expiryField.value.trim())) {
          isValid = false;
          expiryField.classList.add('error');
          const expiryGroup = expiryField.closest('.form-group');
          const errMsg = expiryGroup?.querySelector('.error-message');
          if (errMsg) errMsg.classList.add('show');
        }
      }
    }

    // Top-of-card validation banner mirrors the inline field errors
    if (this.errorBanner) {
      this.errorBanner.classList.toggle('show', !isValid);
    }

    // On a long step the first error can be off-screen above the Next button,
    // so bring it into view (and focus it) instead of leaving the user stuck.
    if (!isValid) {
      this.scrollToFirstError(currentStepElement);
    }

    console.log(isValid ? '✅ Overall validation PASSED' : '❌ Overall validation FAILED');
    return isValid;
  }

  // Scroll/focus the first invalid field on the current step. Every invalid
  // field shows a `.error-message.show` inside its `.field`/`.form-group`
  // wrapper (covers text inputs, custom dropdowns, radios, checkboxes and the
  // file upload), so that is the most reliable anchor. Falls back to the
  // top-of-card error banner.
  scrollToFirstError(stepEl) {
    if (!stepEl) return;
    const firstErrorMsg = stepEl.querySelector('.error-message.show');
    let target = null;
    if (firstErrorMsg) {
      target = firstErrorMsg.closest('.field') || firstErrorMsg.closest('.form-group') || firstErrorMsg;
    } else {
      target = stepEl.querySelector('.field__input.error, .form-control.error, .error') || this.errorBanner;
    }
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Move keyboard focus to the first usable control in that wrapper. Delay
    // slightly so the focus jump doesn't fight the smooth scroll.
    const focusable = target.querySelector
      ? target.querySelector('input:not([type=hidden]):not([readonly]), select, textarea, summary, [tabindex]')
      : null;
    if (focusable) {
      setTimeout(() => {
        try { focusable.focus({ preventScroll: true }); } catch (e) { focusable.focus(); }
      }, 80);
    }
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  calculateAge(year, month, day) {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  navigateToStep(targetStep) {
    console.log('🎯 Navigating to step', targetStep, 'from step', this.currentStep);
    this.currentStep = targetStep;
    this.updateDisplay();
    this.scrollToTop();
  }

  updateDisplay() {
    console.log('🔄 Updating display for step', this.currentStep);

    // Errors are step-scoped — clear the banner when changing steps
    if (this.errorBanner) this.errorBanner.classList.remove('show');

    // Update steps visibility
    this.steps.forEach((step, index) => {
      step.classList.toggle('active', parseInt(step.dataset.step) === this.currentStep);
    });
    
    // Update progress indicator
    this.stepItems.forEach(stepItem => {
      const stepNumber = parseInt(stepItem.dataset.step);
      
      // Remove all state classes
      stepItem.classList.remove('completed', 'current', 'clickable');
      
      // Add appropriate class
      if (this.completedSteps.has(stepNumber)) {
        stepItem.classList.add('completed', 'clickable');
      }
      
      if (stepNumber === this.currentStep) {
        stepItem.classList.add('current');
      }
    });
    
    console.log('✓ Progress updated - Completed steps:', Array.from(this.completedSteps));
    
    // Scroll to current step in mobile view
    const currentStepItem = this.querySelector(`.step-item[data-step="${this.currentStep}"]`);
    if (currentStepItem && window.innerWidth <= 768) {
      currentStepItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    
    // Update buttons
    this.btnBack.disabled = this.currentStep === 1;
    
    if (this.currentStep === 6) {
      this.btnNext.style.display = 'none';
      this.btnSubmit.style.display = 'inline-block';
      console.log('🏁 Final step - showing submit button');
    } else {
      this.btnNext.style.display = 'inline-block';
      this.btnSubmit.style.display = 'none';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    console.log('📝 Form submission started');
    
    if (!this.validateCurrentStep()) {
      console.log('❌ Final step validation failed');
      return;
    }
    
    console.log('✅ Final step validation passed');
    
    // Collect all form data
    const formData = new FormData(this.form);
    const rawData = {};
    
    for (let [key, value] of formData.entries()) {
      if (key === 'quitMethods' || key === 'quitMotivation' || key === 'medicalConditions' || key === 'highRiskMedications') {
        if (!rawData[key]) rawData[key] = [];
        rawData[key].push(value);
      } else {
        rawData[key] = value;
      }
    }

    // Capture disabled "I don't know" field values
    ['vapingStrength', 'vapingVolume'].forEach(id => {
      const el = this.form.querySelector('#' + id);
      if (el && el.disabled) rawData[id] = el.value;
    });
    
    // Store in sessionStorage as backup
    sessionStorage.setItem('patientIntakeFormData', JSON.stringify(rawData));
    console.log('💾 Form data saved to sessionStorage as backup');
    
    // Transform data to match backend API expectations
    const data = this.transformFormData(rawData);
    console.log('📊 Transformed form data:', data);
    
    // Attach proof of age file as base64
    if (this.uploadedFile) {
      try {
        data.proofOfAge = await this.fileToBase64(this.uploadedFile);
        data.proofOfAgeFileName = this.uploadedFile.name;
        data.proofOfAgeFileType = this.uploadedFile.type;
      } catch (fileErr) {
        console.error('❌ Failed to read proof of age file:', fileErr);
      }
    }

    // Show loading state
    this.setLoadingState(true);
    
    try {
      const response = await fetch('https://api.quity.com.au/api/intake?shop=quity.com.au', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || `Server error: ${response.status}`);
        } else {
          // Non-JSON response (e.g., HTML error page)
          console.error('❌ Server returned non-JSON response:', response.status);
          throw new Error(`Service unavailable (${response.status}). Please try again later.`);
        }
      }
      
      // Parse successful response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      console.log('📥 API response:', result);
      
      if (result.success) {
        console.log('🎉 Form submitted successfully!');
        console.log('👤 Patient ID:', result.patientId);
        
        // Clear session storage on success
        sessionStorage.removeItem('patientIntakeFormData');
        sessionStorage.removeItem('patientIntakeFormProgress');
        
        // Show success message
        this.showSuccessMessage(result.patientId);
      } else {
        console.error('❌ Submission failed:', result.error);
        this.showErrorMessage(result.error || 'Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      this.showErrorMessage(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  transformFormData(rawData) {
    const data = {
      firstName: rawData.firstName || '',
      lastName: rawData.lastName || '',
      email: rawData.email || '',
      dob: rawData.dob || '',
      dobDay: rawData.dob ? rawData.dob.split('-')[2] : '',
      dobMonth: rawData.dob ? rawData.dob.split('-')[1] : '',
      dobYear: rawData.dob ? rawData.dob.split('-')[0] : '',
      gender: rawData.gender || '',
      medicareNumber: rawData.medicareNumber || '',
      streetAddress: rawData.streetAddress || '',
      city: rawData.city || '',
      state: rawData.state || '',
      postcode: rawData.postcode || '',
      country: rawData.country || 'Australia',
      mobile: rawData.mobile || '',
      smokingStatus: rawData.smokingStatus || '',
      cigarettesPerDay: rawData.cigarettesPerDay || '',
      yearsSmoked: rawData.yearsSmoked || '',
      timesTriedQuitting: rawData.timesTriedQuitting || '',
      quitMotivation: rawData.quitMotivation || [],
      quitMethods: rawData.quitMethods || [],
      quitMethodExplanation: rawData.quitMethodExplanation || '',
      lastCigarette: rawData.lastCigarette || '',
      vapingStatus: rawData.vapingStatus || '',
      vapingMethod: rawData.vapingMethod || '',
      vapingStrength: rawData.vapingStrength || '',
      vapingVolume: rawData.vapingVolume || '',
      vapingNotes: rawData.vapingNotes || '',
      hasMedicalConditions: rawData.hasMedicalConditions || '',
      medicalConditions: rawData.medicalConditions || [],
      medicalConditionsOther: rawData.medicalConditionsOther || '',
      takesMedication: rawData.takesMedication || '',
      highRiskMedications: rawData.highRiskMedications || [],
      medicationsList: rawData.medicationsList || '',
      cardiovascular: rawData.cardiovascular || '',
      pregnancy: rawData.pregnancy || '',
      additionalNotes: rawData.additionalNotes || '',
      safetyAcknowledgment: rawData.safetyAcknowledgment === 'on' ? 'yes' : 'no'
    };

    // Only include medicareIRN if it is a valid digit 1-9
    const irn = (rawData.medicareIRN || '').trim();
    if (/^[1-9]$/.test(irn)) {
      data.medicareIRN = irn;
    }

    // Only include medicareExpiry if it matches MM/YYYY format
    const expiry = (rawData.medicareExpiry || '').trim();
    if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(expiry)) {
      data.medicareExpiry = expiry;
    }

    return data;
  }

  setLoadingState(isLoading) {
    if (isLoading) {
      this.btnSubmit.disabled = true;
      this.btnSubmit.dataset.originalText = this.btnSubmit.textContent;
      this.btnSubmit.textContent = 'Submitting...';
      this.btnSubmit.classList.add('loading');
      this.btnBack.disabled = true;
    } else {
      this.btnSubmit.disabled = false;
      this.btnSubmit.textContent = this.btnSubmit.dataset.originalText || 'Submit';
      this.btnSubmit.classList.remove('loading');
      this.btnBack.disabled = false;
    }
  }

  showSuccessMessage(patientId) {
    this.form.style.display = 'none';
    this.querySelector('.progress-indicator').style.display = 'none';
    this.querySelector('.form-navigation').style.display = 'none';
    
    // Populate the reference chip with the server-issued ID, or a
    // generated QY- code as a fallback.
    const refEl = this.successMessage.querySelector('#successRef');
    if (refEl) {
      refEl.textContent = patientId
        ? String(patientId)
        : 'QY-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    }
    
    this.successMessage.classList.add('show');
    console.log('🎉 Success message displayed');
    this.scrollToTop();
  }

  showErrorMessage(message) {
    // Check if error container exists, if not create one
    let errorContainer = this.querySelector('.form-error-message');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'form-error-message';
      errorContainer.style.cssText = 'background: #fee2e2; border: 1px solid #ef4444; color: #dc2626; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;';
      this.form.insertBefore(errorContainer, this.form.firstChild);
    }
    
    errorContainer.innerHTML = `
      <strong>⚠️ Submission Error</strong>
      <p style="margin: 8px 0 0 0;">${message}</p>
    `;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 10000);
    
    this.scrollToTop();
  }

  saveToSession() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (key === 'quitMethods' || key === 'quitMotivation' || key === 'medicalConditions' || key === 'highRiskMedications') {
        if (!data[key]) data[key] = [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    data.currentStep = this.currentStep;
    data.completedSteps = Array.from(this.completedSteps);
    sessionStorage.setItem('patientIntakeFormProgress', JSON.stringify(data));
    console.log('💾 Progress saved - Step:', this.currentStep, '| Completed:', Array.from(this.completedSteps));
  }

  loadFromSession() {
    const saved = sessionStorage.getItem('patientIntakeFormProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.formData = data;
        if (data.currentStep) {
          this.currentStep = data.currentStep;
        }
        if (data.completedSteps && Array.isArray(data.completedSteps)) {
          this.completedSteps = new Set(data.completedSteps);
        }
        console.log('📂 Loaded from session - Step:', this.currentStep, '| Completed:', Array.from(this.completedSteps));
      } catch (e) {
        console.error('❌ Error loading saved progress:', e);
      }
    } else {
      console.log('📂 No saved progress found');
    }
  }

  restoreFormData() {
    if (Object.keys(this.formData).length === 0) {
      console.log('📄 No form data to restore');
      return;
    }
    
    console.log('📝 Restoring form data...');
    
    Object.keys(this.formData).forEach(key => {
      if (key === 'currentStep' || key === 'completedSteps') return;
      
      const elements = this.form.elements[key];
      if (!elements) return;
      
      if ((key === 'quitMethods' || key === 'quitMotivation' || key === 'medicalConditions' || key === 'highRiskMedications') && Array.isArray(this.formData[key])) {
        this.formData[key].forEach(value => {
          const checkbox = this.form.querySelector(`input[name="${key}"][value="${value}"]`);
          if (checkbox) {
            checkbox.checked = true;
            const parent = checkbox.closest('.checkbox-option');
            if (parent) parent.classList.add('selected');
          }
        });
      } else if (elements.type === 'radio') {
        const radio = this.form.querySelector(`input[name="${key}"][value="${this.formData[key]}"]`);
        if (radio) {
          radio.checked = true;
          const parent = radio.closest('.radio-option, .radio-card');
          if (parent) parent.classList.add('selected');
        }
      } else if (elements.type === 'checkbox') {
        elements.checked = this.formData[key] === 'on' || this.formData[key] === true;
        const parent = elements.closest('.checkbox-standalone');
        if (parent && elements.checked) parent.classList.add('selected');
      } else if (!elements.readOnly) {
        // Skip read-only fields (e.g. name/email pulled from the customer
        // account) so saved session data can't overwrite the account values.
        elements.value = this.formData[key];
      }
    });
    
    // Restore medications conditional visibility
    const takesMedication = this.form.elements['takesMedication']?.value;
    if (takesMedication === 'yes') {
      const medicationsGroup = this.querySelector('#medicationsListGroup');
      if (medicationsGroup) medicationsGroup.style.display = '';
      // Show free-text only if "other" is checked
      const otherMedCb = this.form.querySelector('input[name="highRiskMedications"][value="other"]');
      if (otherMedCb && otherMedCb.checked) {
        const medicationsTextGroup = this.querySelector('#medicationsTextGroup');
        const medicationsTextarea = this.querySelector('#medicationsList');
        if (medicationsTextGroup) {
          medicationsTextGroup.style.display = '';
          medicationsTextarea.setAttribute('required', '');
        }
      }
    }

    // Restore medical conditions conditional visibility
    const hasMedicalConditions = this.form.elements['hasMedicalConditions']?.value;
    if (hasMedicalConditions === 'yes') {
      const conditionsGroup = this.querySelector('#medicalConditionsGroup');
      if (conditionsGroup) conditionsGroup.style.display = '';
      // Restore "other" textarea visibility
      const otherCb = this.form.querySelector('input[name="medicalConditions"][value="other"]');
      if (otherCb && otherCb.checked) {
        const otherGroup = this.querySelector('#medicalConditionsOtherGroup');
        const otherTextarea = this.querySelector('#medicalConditionsOther');
        if (otherGroup) otherGroup.style.display = '';
        if (otherTextarea) otherTextarea.setAttribute('required', '');
      }
    }

    // Restore "I don't know" checkbox states for vaping fields
    [['idkVapingStrength', 'vapingStrength'], ['idkVapingVolume', 'vapingVolume']].forEach(([cbId, inputId]) => {
      const cb = this.form.querySelector('#' + cbId);
      const input = this.form.querySelector('#' + inputId);
      if (cb && input && input.value === "I don't know") {
        cb.checked = true;
        input.disabled = true;
        const parent = cb.closest('.checkbox-standalone');
        if (parent) parent.classList.add('selected');
      }
    });

    console.log('✅ Form data restored');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindFileUpload() {
    const uploadZone = this.querySelector('#fileUploadZone');
    const fileInput = this.querySelector('#proofOfAge');
    const placeholder = this.querySelector('#fileUploadPlaceholder');
    const preview = this.querySelector('#fileUploadPreview');
    const previewName = this.querySelector('#filePreviewName');
    const previewSize = this.querySelector('#filePreviewSize');
    const removeBtn = this.querySelector('#fileRemoveBtn');

    if (!uploadZone || !fileInput) return;

    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf'];

    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleFile = (file) => {
      // Clear previous errors
      uploadZone.classList.remove('error');
      const formGroup = fileInput.closest('.field') || fileInput.closest('.form-group');
      const errorMsg = formGroup?.querySelector('.error-message');
      if (errorMsg) errorMsg.classList.remove('show');

      if (!allowedTypes.includes(file.type)) {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid file type. Please upload an image (JPG, PNG, HEIC) or PDF.';
          errorMsg.classList.add('show');
        }
        uploadZone.classList.add('error');
        return;
      }

      if (file.size > maxSize) {
        if (errorMsg) {
          errorMsg.textContent = 'File is too large. Maximum size is 10 MB.';
          errorMsg.classList.add('show');
        }
        uploadZone.classList.add('error');
        return;
      }

      this.uploadedFile = file;
      previewName.textContent = file.name;
      previewSize.textContent = formatSize(file.size);
      placeholder.style.display = 'none';
      preview.style.display = 'flex';
      uploadZone.classList.add('has-file');

      // Reset error message text for future validations
      if (errorMsg) errorMsg.textContent = 'Please upload a proof of age document';

      this.saveToSession();
    };

    // Click to browse
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('.file-remove-btn')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(evt => {
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('drag-over');
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    });

    // Remove button
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.uploadedFile = null;
        fileInput.value = '';
        placeholder.style.display = '';
        preview.style.display = 'none';
        uploadZone.classList.remove('has-file');
      });
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  bindIdkCheckbox(checkboxId, textInputId) {
    const checkbox = this.form.querySelector('#' + checkboxId);
    const textInput = this.form.querySelector('#' + textInputId);
    if (!checkbox || !textInput) return;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        textInput.value = "I don't know";
        textInput.disabled = true;
        textInput.classList.remove('error');
        const errorMsg = textInput.closest('.form-group')?.querySelector('.error-message');
        if (errorMsg) errorMsg.classList.remove('show');
      } else {
        textInput.value = '';
        textInput.disabled = false;
      }
    });

    textInput.addEventListener('input', () => {
      if (textInput.value !== "I don't know") {
        checkbox.checked = false;
        const parent = checkbox.closest('.checkbox-standalone');
        if (parent) parent.classList.remove('selected');
      }
    });
  }

  // ============================================================
  // Brand UI kit controls (https://brand.quity.com.au/ui.html)
  // The native <select> and <input type="date"> are progressively
  // enhanced into the kit's <details>-based dropdown / date picker.
  // Each control writes through to a hidden <input> so the existing
  // FormData / validation / session-restore logic is untouched.
  // Called after restoreFormData() so saved values render correctly.
  // ============================================================
  initBrandControls() {
    // Dropdowns and the date picker are independent — one failing must not
    // take the other down.
    try { this.initBrandDropdowns(); } catch (e) { console.error('[intake] dropdowns failed:', e); }
    try { this.initBrandDatePicker(); } catch (e) { console.error('[intake] datepicker failed:', e); }
    try { this.bindBrandOutsideClose(); } catch (e) { console.error('[intake] outside-close failed:', e); }
  }

  // Close any open dropdown on outside click or Escape. (The date picker
  // is flatpickr, which manages its own open/close behaviour.)
  bindBrandOutsideClose() {
    document.addEventListener('click', (e) => {
      this.querySelectorAll('.dropdown[open]').forEach(d => {
        if (!d.contains(e.target)) d.open = false;
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      this.querySelectorAll('.dropdown[open]').forEach(d => {
        d.open = false;
        const summary = d.querySelector('summary');
        if (summary) summary.focus();
      });
    });
  }

  initBrandDropdowns() {
    this.querySelectorAll('[data-dropdown]').forEach(details => {
     try {
      const field = details.closest('.field');
      const input = field && field.querySelector('input[type="hidden"]');
      const valEl = details.querySelector('.dd-val');
      const opts = Array.from(details.querySelectorAll('.opt'));
      if (!field || !input || !valEl) return;

      const placeholder = valEl.textContent;

      const apply = (value, { silent = false } = {}) => {
        let label = placeholder;
        let matched = false;
        opts.forEach(o => {
          const on = value !== '' && o.dataset.value === value;
          o.classList.toggle('on', on);
          if (on) { label = o.textContent.trim(); matched = true; }
        });
        input.value = matched ? value : '';
        valEl.textContent = label;
        valEl.classList.toggle('ph', !matched);
        if (matched) this.clearBrandError(field, input);
        if (!silent) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      opts.forEach(o => {
        o.setAttribute('tabindex', '0');
        o.setAttribute('role', 'option');
        const choose = () => {
          apply(o.dataset.value);
          details.open = false;
          const summary = details.querySelector('summary');
          if (summary) summary.focus();
        };
        o.addEventListener('click', choose);
        o.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
        });
      });

      // Only one dropdown open at a time.
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        this.querySelectorAll('.dropdown[open]').forEach(d => {
          if (d !== details) d.open = false;
        });
      });

      // Reflect the current hidden value (default or session-restored).
      apply(input.value || '', { silent: true });
     } catch (e) { console.error('[intake] dropdown init failed:', e); }
    });
  }

  // Date of birth uses flatpickr (https://flatpickr.js.org) — a proper,
  // well-tested datepicker. Both the month AND the year are exposed as
  // dropdowns (the year stepper is replaced by a <select> of every valid
  // year, most-recent first), so jumping across decades takes a single
  // click — the MUI-style "pick a year" experience that a DOB field needs.
  // flatpickr keeps the canonical YYYY-MM-DD value on the hidden #dob input
  // (preserving the FormData / validation / age-check contract) and shows a
  // friendly DD / MM / YYYY alt input to the user.
  initBrandDatePicker() {
    const input = this.querySelector('[data-datepicker]');
    if (!input) return;

    const fieldGroup = input.closest('.field');
    const isISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const minDate = isISO(input.dataset.min) ? input.dataset.min : '1900-01-01';
    const maxDate = isISO(input.dataset.max) ? input.dataset.max : todayISO;

    // Progressive enhancement: if flatpickr failed to load, fall back to a
    // native date input so date of birth stays usable.
    if (typeof window.flatpickr !== 'function') {
      input.type = 'date';
      input.min = minDate;
      input.max = maxDate;
      return;
    }

    window.flatpickr(input, {
      dateFormat: 'Y-m-d',                 // value stored on #dob (backend contract)
      altInput: true,                      // friendly visible field
      altFormat: 'd / m / Y',
      altInputClass: 'field__input form-control fp-dob',
      minDate: minDate,
      maxDate: maxDate,
      defaultDate: isISO(input.value) ? input.value : null,
      disableMobile: true,                 // styled picker (month + year selectors) on every device
      monthSelectorType: 'dropdown',
      allowInput: true,                    // let users type DD / MM / YYYY directly
      clickOpens: false,                   // typing in the box shouldn't pop the calendar; the icon does
      // Lenient parser so typed dates work with or without spaces around the
      // separators (15/06/1990, 15 / 06 / 1990, 15-06-1990 all parse). The
      // canonical value flatpickr stores is YYYY-MM-DD (4-digit-dash), which
      // is unambiguous; anything else is treated as day-first (DD MM YYYY).
      parseDate: (str) => {
        const s = String(str || '').trim();
        if (!s) return undefined;
        const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) {
          const dt = new Date(+iso[1], +iso[2] - 1, +iso[3]);
          return isNaN(dt.getTime()) ? undefined : dt;
        }
        const p = s.split(/\D+/).filter(Boolean).map(Number);
        if (p.length !== 3) return undefined;
        let [d, mo, y] = p;
        if (y < 100) y += y > 30 ? 1900 : 2000;
        const dt = new Date(y, mo - 1, d);
        // Reject impossible dates (e.g. 32/13/2000) that Date would roll over.
        if (isNaN(dt.getTime()) || dt.getDate() !== d || dt.getMonth() !== mo - 1) return undefined;
        return dt;
      },
      prevArrow: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"></path></svg>',
      nextArrow: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"></path></svg>',
      onReady: (dates, str, fp) => {
        fp.calendarContainer.classList.add('qy-cal');
        this.buildYearDropdown(fp, minDate, maxDate);
        this.buildCalendarToggle(fp);
      },
      // Keep the year <select> in sync when the year changes by any other
      // route (the prev/next arrows crossing a year boundary, setDate, etc.).
      onYearChange: (dates, str, fp) => { this.syncYearDropdown(fp); },
      onChange: () => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        this.clearBrandError(fieldGroup, input);
      }
    });
  }

  // Replace flatpickr's year number-stepper with a <select> listing every
  // selectable year (most recent first, which is what a DOB wants). Picking
  // a year jumps the calendar straight there — no clicking arrows 40 times.
  buildYearDropdown(fp, minDate, maxDate) {
    const wrap = fp.calendarContainer.querySelector('.numInputWrapper');
    if (!wrap || wrap.dataset.qyYear) return;
    wrap.dataset.qyYear = '1';

    const minYear = parseInt(String(minDate).slice(0, 4), 10);
    const maxYear = parseInt(String(maxDate).slice(0, 4), 10);
    if (!minYear || !maxYear) return;

    const select = document.createElement('select');
    select.className = 'qy-year-select';
    select.setAttribute('aria-label', 'Year');
    for (let y = maxYear; y >= minYear; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      select.appendChild(opt);
    }
    select.value = String(fp.currentYear);
    select.addEventListener('change', () => {
      fp.changeYear(parseInt(select.value, 10));
    });

    wrap.style.display = 'none';
    wrap.parentNode.insertBefore(select, wrap);
    fp._qyYearSelect = select;
  }

  // Mirror the displayed year onto the <select> when it changed elsewhere.
  syncYearDropdown(fp) {
    if (fp._qyYearSelect) fp._qyYearSelect.value = String(fp.currentYear);
  }

  // With clickOpens disabled (so the field is freely typeable), give the
  // user an explicit calendar icon to open the picker. The visible alt
  // input is wrapped so the icon button can sit at its right edge.
  buildCalendarToggle(fp) {
    const alt = fp.altInput;
    if (!alt || alt.dataset.qyToggle) return;
    alt.dataset.qyToggle = '1';

    const wrap = document.createElement('div');
    wrap.className = 'qy-dob-wrap';
    alt.parentNode.insertBefore(wrap, alt);
    wrap.appendChild(alt);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qy-dob-cal-btn';
    btn.setAttribute('aria-label', 'Open calendar');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>';
    // flatpickr closes on document mousedown (fires before click), so a
    // mouse press would close-then-reopen. Block that on mousedown (and keep
    // focus on the input), then toggle on click so keyboard activation works.
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener('click', () => {
      if (fp.isOpen) fp.close();
      else fp.open();
    });
    wrap.appendChild(btn);
  }

  // Clear a brand control's inline error once a value is chosen. The
  // top-of-card banner is left to re-evaluate on the next validation,
  // matching how the text inputs behave.
  clearBrandError(field, input) {
    if (input) input.classList.remove('error');
    const errorMsg = field && field.querySelector('.error-message');
    if (errorMsg) errorMsg.classList.remove('show');
  }
}

customElements.define('patient-intake-form', PatientIntakeForm);
