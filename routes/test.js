function sendMessage() {
    var xhttp = new XMLHttpRequest();
    var sendingText = document.getElementById("send-message").value;

    xhttp.onreadystatechange = () => {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            document.getElementById("display-res-text").innerHTML = xhttp.responseText;
        }
    };

    xhttp.open("POST","http://127.0.0.1:3000", true);
    xhttp.send(sendingText)
}