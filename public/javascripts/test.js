// function sendMessage() {
//     var xhttp = new XMLHttpRequest();
//     var userEmail = document.getElementById("user-name").value;
//     var passWord = document.getElementById("password").value;
//     var Request = {
//         email: userEmail,
//         password: passWord
//     };


//     xhttp.open("POST", "/", true);

//     //Send the proper header information along with the request
//     xhttp.setRequestHeader("Content-type", "application/json");

//     xhttp.onreadystatechange = () => {
//         if (xhttp.readyState == 4 && xhttp.status == 200) {
//             document.getElementById("display-res-text").innerHTML = xhttp.responseText;
//         }

//     };

//     //Error here => FIX IT !!

//     var JSONRequest = JSON.stringify(Request);
//     xhttp.send(JSONRequest);
// }

function moveToLocalLogin() {
    window.location.pathname = '/login';
}

function moveToLocalSignup() {
    window.location.pathname = '/index';
}

function logout() {
    window.location.pathname = '/logout';
}