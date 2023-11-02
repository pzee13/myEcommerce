function validAddress() {
    const firstname = document.getElementById('fname').value;
    const lastname =  document.getElementById('lname').value;
    const mobile = document.getElementById('mobile').value;
    const email = document.getElementById('email').value;
    const housename = document.getElementById('housename').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value;
    const pincode = document.getElementById('pin').value;

    document.getElementById('fname-error').textContent = '';
    document.getElementById('lname-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('housename-error').textContent = '';
    document.getElementById('state-error').textContent = '';
    document.getElementById('mobile-error').textContent = '';
    document.getElementById('district-error').textContent = '';
    document.getElementById('city-error').textContent = '';
    document.getElementById('pin-error').textContent = '';

    if (!firstname) {
        document.getElementById('name-error').textContent = 'First Name field should not be empty!';
        return false;
    }

    if (!lastname) {
        document.getElementById('lname-error').textContent = 'Last Name field should not be empty!';
        return false;
    }

    if (!state) {
        document.getElementById('state-error').textContent = 'State field should not be empty!';
        return false;
    }

    if (!housename) {
        document.getElementById('housename-error').textContent = 'housename field should not be empty!';
        return false;
    }

    const mobileRegex = /^[6-9]\d{9}$/;

if (!mobile || !mobileRegex.test(mobile)) {
    document.getElementById('mobile-error').textContent = 'Mobile number should be a 10-digit valid number';
    return false;
}

if (new Set(mobile).size === 1) {
    document.getElementById('mobile-error').textContent = 'Mobile number should not consist of the same digit.';
    return false;
}

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

if (!email || !emailRegex.test(email)) {
  document.getElementById('email-error').textContent = 'Please enter a valid email address. (eg: example@gmail.com)';
  return false;
}

    if (!district) {
        document.getElementById('district-error').textContent = 'District field should not be empty!';
        return false;
    }

    if (!city) {
        document.getElementById('city-error').textContent = 'City field should not be empty!';
        return false;
    }

    const pincodeRegex = /^\d{6}$/;

    if (!pincode || !pincode.match(pincodeRegex)) {
        document.getElementById('pin-error').textContent = 'Pincode should be a 6-digit numeric value.';
        return false;
    }

    return true;
}


