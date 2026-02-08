/**
 * Account Dashboard - Address Modal Logic
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Address modal open/close
    const openBtns = document.querySelectorAll('[data-open-address-modal]');
    const closeBtns = document.querySelectorAll('[data-close-address-modal]');
    const modals = document.querySelectorAll('.account-address-modal');

    openBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = btn.getAttribute('data-open-address-modal');
        const modal = document.getElementById(targetId);
        if (modal) {
          modal.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const modal = btn.closest('.account-address-modal');
        if (modal) {
          modal.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    modals.forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          modal.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    // Address country/province selectors
    if (typeof Shopify !== 'undefined' && Shopify.CountryProvinceSelector) {
      // New address form
      var newCountry = document.getElementById('AddressCountryNew');
      if (newCountry) {
        new Shopify.CountryProvinceSelector(
          'AddressCountryNew',
          'AddressProvinceNew',
          { hideElement: 'AddressProvinceContainerNew' }
        );
      }

      // Edit address forms
      var editCountries = document.querySelectorAll('.address-country-option');
      editCountries.forEach(function (el) {
        var formId = el.getAttribute('data-form-id');
        new Shopify.CountryProvinceSelector(
          'AddressCountry_' + formId,
          'AddressProvince_' + formId,
          { hideElement: 'AddressProvinceContainer_' + formId }
        );
      });
    }

    // Address delete confirmation
    var deleteBtns = document.querySelectorAll('.address-delete');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var confirmMessage = btn.getAttribute('data-confirm-message');
        if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
          var formId = btn.getAttribute('data-form-id');
          if (typeof Shopify !== 'undefined' && Shopify.postLink) {
            Shopify.postLink('/account/addresses/' + formId, {
              parameters: { _method: 'delete' }
            });
          }
        }
      });
    });

    // Sidebar active state
    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.account-sidebar__nav a');
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  });
})();
