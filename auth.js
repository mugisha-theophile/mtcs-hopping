function handleAdminLogin(event) {
    event.preventDefault();
    const nameInput = event.target.querySelector('input[type="text"]').value;
    const pwdInput = event.target.querySelector('input[type="password"]').value;
    
    // Check credentials logic extracted from index.html to hide it from inline view source
    if (nameInput === 'admin' && pwdInput === 'admin123') {
        // Store simple token to prevent direct access check on admin.html
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        window.location.href = 'admin.html';
    } else {
        alert('Invalid admin credentials!');
    }
}

// Function inside admin.html to check if accessed directly without logging in
function verifyAdminAccess() {
    if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    window.location.href = 'index.html';
}
