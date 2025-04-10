document.body.style.backgroundImage = "url('783472.jpg')";
document.body.style.backgroundSize = "cover";
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundPosition = "horizontal vertical";

// Toggle visibility for the password field
document.getElementById("show-password").addEventListener("change", function () {
    const passwordField = document.getElementById("password");
    passwordField.type = this.checked ? "text" : "password";
});

// Toggle visibility for the confirm password field
document.getElementById("show-confirm-password").addEventListener("change", function () {
    const confirmPasswordField = document.getElementById("confirm-password");
    confirmPasswordField.type = this.checked ? "text" : "password";
});