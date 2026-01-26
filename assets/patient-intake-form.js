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
    this.completedSteps = new Set();
    
    this.init();
  }

  init() {
    console.log('🔧 PatientIntakeForm initialized');
    console.log('📊 Current step:', this.currentStep);
    console.log('📝 Total steps:', this.totalSteps);
    this.loadFromSession();
    this.updateDisplay();
    this.bindEvents();
    this.restoreFormData();
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
      if (smokingStatus === 'never-smoked') {
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
      if (smokingStatus === 'never-smoked') {
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
      } else if (field.name === 'quitMethods') {
        const checkboxes = currentStepElement.querySelectorAll('input[name="quitMethods"]');
        const isAnyChecked = Array.from(checkboxes).some(cb => cb.checked);
        console.log(`    ☑️ At least one checkbox checked:`, isAnyChecked);
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
      if (this.currentStep === 1 && (field.id === 'dobDay' || field.id === 'dobMonth' || field.id === 'dobYear')) {
        const day = this.form.elements['dobDay'].value;
        const month = this.form.elements['dobMonth'].value;
        const year = this.form.elements['dobYear'].value;
        
        if (day && month && year) {
          const age = this.calculateAge(year, month, day);
          console.log(`    🎂 Age calculated:`, age);
          if (age < 18) {
            console.log(`    ❌ Age validation failed: under 18`);
            fieldValid = false;
            this.form.elements['dobDay'].classList.add('error');
            this.form.elements['dobMonth'].classList.add('error');
            this.form.elements['dobYear'].classList.add('error');
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
    
    console.log(isValid ? '✅ Overall validation PASSED' : '❌ Overall validation FAILED');
    return isValid;
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

  handleSubmit(e) {
    e.preventDefault();
    console.log('📝 Form submission started');
    
    if (!this.validateCurrentStep()) {
      console.log('❌ Final step validation failed');
      return;
    }
    
    console.log('✅ Final step validation passed');
    
    // Collect all form data
    const formData = new FormData(this.form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (key === 'quitMethods') {
        if (!data[key]) data[key] = [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('patientIntakeFormData', JSON.stringify(data));
    console.log('💾 Form data saved to sessionStorage');
    
    // Log to console (for testing without API)
    console.log('📋 FORM SUBMITTED SUCCESSFULLY!');
    console.log('📊 Complete form data:', data);
    console.table(data);
    
    // Show success message
    this.form.style.display = 'none';
    this.querySelector('.progress-indicator').style.display = 'none';
    this.querySelector('.form-navigation').style.display = 'none';
    this.successMessage.classList.add('show');
    
    console.log('🎉 Success message displayed');
    this.scrollToTop();
  }

  saveToSession() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (key === 'quitMethods') {
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
      
      if (key === 'quitMethods' && Array.isArray(this.formData[key])) {
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
      } else {
        elements.value = this.formData[key];
      }
    });
    
    console.log('✅ Form data restored');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

customElements.define('patient-intake-form', PatientIntakeForm);
