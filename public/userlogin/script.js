
//for password and confirm password checking 

document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("cpassword");
    const passwordMismatchDiv = document.getElementById("password-mismatch");
  
    form.addEventListener("submit", function(event) {
      if (passwordField.value !== confirmPasswordField.value) {
        passwordMismatchDiv.style.display = "block";
        event.preventDefault(); // Prevent form submission
      } else {
        passwordMismatchDiv.style.display = "none";
      }
    });
  });

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

    function validRegister()
    {
      
    }



  
  
  