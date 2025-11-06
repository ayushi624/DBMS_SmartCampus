document.addEventListener('DOMContentLoaded', () => {

    // loading the tasksssss from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    const searchInput = document.getElementById('search');

    // gm and gn
    function updateGreeting() {
        const hour = new Date().getHours();
        const greetingEl = document.querySelector('.welcome h2');

        if (hour < 12) {
            greetingEl.textContent = 'Good morning, Ayushi!';
        } else if (hour < 18) {
            greetingEl.textContent = 'Good afternoon, Ayushi!';
        } else {
            greetingEl.textContent = 'Good evening, Ayushi!';
        }
    }

    function filterCards() {
        const query = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.quick-access .card');

        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', filterCards);

    updateGreeting();
});