const form = document.getElementById('orderForm');
const message = document.getElementById('formMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  const response = await fetch('/order', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    message.textContent = 'Order placed successfully!';
    form.reset();
  } else {
    message.textContent = 'Failed to place order. Try again.';
  }
});
