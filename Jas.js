alert ("Welcome to our store! We hope you have a great experience.");

let customerName = prompt("Please enter your name:");
let itemOrdered = prompt("Please enter the item you want to order:");
let quantity = prompt("Please enter the quantity you want to order (1-99):");

while (!customerName || customerName.trim() === "") {
    customerName = prompt("Please enter a valid name:");
}

while (!itemOrdered || itemOrdered.trim() === "") {
    itemOrdered = prompt("Please enter a valid item name:");
}


quantity = parseInt(quantity);
while (isNaN(quantity) || quantity < 1 || quantity > 99) {
    alert("Invalid quantity. Please enter a number between 1 and 99.");
    quantity = parseInt(prompt("Please enter the quantity you want to order (1-99):"));
}

let currentHour = new Date().getHours();

let greeting; 

if (currentHour < 12) {
    greeting = "Good Morning";
} else if (currentHour < 18) {
    greeting = "Good Afternoon";
} else {
    greeting = "Good Evening";
}

let currentDate = new Date()
currentDate.setDate(currentDate.getDate() + 7);
let deliveryDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

document.getElementById("greeting").innerText = `${greeting}, ${customerName}! Thank you for ordering.`;
document.getElementById("order-summary").innerText = `You ordered ${quantity} of ${itemOrdered}.`;
document.getElementById("delivery-date").innerText = `Your order will arrive on: ${deliveryDate}`;
document.getElementById("thank-you").innerText = "Thank you for shopping with us!";
document.getElementById("thank-you").style.color = "green";