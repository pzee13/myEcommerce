
function validRegister() {
  const name = document.getElementById('myname').value;
  const lname = document.getElementById('mynamel').value;
  const email = document.getElementById('email').value;
  const mobile = document.getElementById('mno').value;
  const password = document.getElementById('password').value;
  const cpassword = document.getElementById('cpassword').value;

  // Clear any previous error messages
  document.getElementById('name-error').textContent = '';
  document.getElementById('lname-error').textContent = '';
  document.getElementById('email-error').textContent = '';
  document.getElementById('mobile-error').textContent = '';
  document.getElementById('password-error').textContent = '';
  document.getElementById('password-mismatch').style.display = 'none';

  if (!name) {
      document.getElementById('name-error').textContent = 'First name field should not be empty!';
      return false;
  }

  if (!lname) {
    document.getElementById('name-error').textContent = 'Last name field should not be empty!';
    return false;
    }

    
  if (!email) {
      document.getElementById('email-error').textContent = 'Email field should not be empty!';
      return false;
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

  if (!email || !emailRegex.test(email)) {
    document.getElementById('email-error').textContent = 'Please enter a valid email address. (eg: example@gmail.com)';
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

const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
if (!password || !passwordRegex.test(password)) {
    document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
    return false;
}

  if (password !== cpassword) {
      document.getElementById('password-mismatch').style.display = 'block';
      return false;
  }

  return true;
}

//for password and confirm password checking 

// document.addEventListener("DOMContentLoaded", function() {
//     const form = document.querySelector("form");
//     const passwordField = document.getElementById("password");
//     const confirmPasswordField = document.getElementById("cpassword");
//     const passwordMismatchDiv = document.getElementById("password-mismatch");
  
//     form.addEventListener("submit", function(event) {
//       if (passwordField.value !== confirmPasswordField.value) {
//         passwordMismatchDiv.style.display = "block";
//         event.preventDefault(); // Prevent form submission
//       } else {
//         passwordMismatchDiv.style.display = "none";
//       }
//     });
//   });

//for invalid messages 
  const invalidMsgSignup = document.getElementById('invalid-msg');
        if(invalidMsgSignup)
            {
                setTimeout(() => {
                    invalidMsgSignup.style.display = 'none';  
                }, 5000);
            }

  const invalidMsgOTP = document.getElementById('invalid-msg');
          if(invalidMsgOTP)
            {
                    setTimeout(() => {
                        invalidMsgOTP.style.display = 'none';  
                    }, 5000);
              }


              //for login validation 
              function validateForm()
              {
                 document.getElementById('email-error').textContent = '';
                 document.getElementById('password-error').textContent = '';
         
                 const email = document.getElementById('email').value;
                 const password = document.getElementById('password').value;
         
                 if (!email) 
                 {
                     document.getElementById('email-error').textContent = 'Email field should not be empty!!';
                     return false;
                 }
         
                 if (!password || password.length < 6) 
                 {
                     document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
                     return false;
                 }
         
                 return true;
              }


            // for only password validation 
              function validatePassword()
              {
                
                 document.getElementById('password-error').textContent = '';
         
                 const password = document.getElementById('password').value;
         
                 if (!password || password.length < 6) 
                 {
                     document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
                     return false;
                 }
         
                 return true;
              }


    //for regitration field validation

   