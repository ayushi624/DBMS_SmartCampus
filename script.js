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
            card.style.display = cardText.includes(query) ? 'block' : 'none';
        });
    }

    searchInput.addEventListener('input', filterCards);
    updateGreeting();



    // -------------------------
    // 🔹 NEW CALENDAR CODE (frontend only)
    // -------------------------

    // grab calendar elements
    const calGrid = document.getElementById("calGrid");
    const monthLabel = document.getElementById("monthLabel");

    if (calGrid && monthLabel) { // ensure calendar exists on this page
        let currentDate = new Date();
        let events = JSON.parse(localStorage.getItem("events")) || [];

        function loadCalendar(date) {
            calGrid.innerHTML = "";
            const year = date.getFullYear();
            const month = date.getMonth();

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            monthLabel.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });

            // Fill previous empty cells
            for (let i = 0; i < firstDay; i++) {
                const div = document.createElement("div");
                div.className = "day other";
                calGrid.appendChild(div);
            }

            // create actual days
            for (let d = 1; d <= daysInMonth; d++) {
                const div = document.createElement("div");
                div.className = "day";

                const formattedDate = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                div.dataset.date = formattedDate;

                div.innerHTML = `<div class="dnum">${d}</div>`;
                calGrid.appendChild(div);
            }

            renderEvents();
        }

        function renderEvents() {
            events.forEach(e => {
                const cell = document.querySelector(`[data-date='${e.date}']`);
                if (cell) {
                    const tag = document.createElement("div");
                    tag.className = "event";

                    // match your theme colors
                    tag.style.background = {
                        class: "#3b82f6",
                        exam: "#ef4444",
                        club: "#a855f7",
                        personal: "#14b8a6"
                    }[e.category] || "#3b82f6";

                    tag.textContent = e.title;
                    cell.appendChild(tag);
                }
            });
        }


        // Save event
        const saveBtn = document.getElementById("saveEvent");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                const title = eventTitle.value;
                const date = eventDate.value;
                const cat = eventCategory.value;

                const newEvent = { title, date, category: cat };
                events.push(newEvent);

                localStorage.setItem("events", JSON.stringify(events));

                document.getElementById("eventPopup").style.display = "none";
                loadCalendar(currentDate);
            });
        }


        // Popup open
        const openBtn = document.getElementById("addEventBtn");
        if (openBtn) {
            openBtn.addEventListener("click", () => {
                document.getElementById("eventPopup").style.display = "block";
            });
        }


        // Month navigation
        const nextBtn = document.getElementById("nextMonth");
        const prevBtn = document.getElementById("prevMonth");
        const todayBtn = document.getElementById("todayBtn");

        if (nextBtn) nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadCalendar(currentDate);
        };

        if (prevBtn) prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadCalendar(currentDate);
        };

        if (todayBtn) todayBtn.onclick = () => {
            currentDate = new Date();
            loadCalendar(currentDate);
        };


        // Initial load calendar only if calendar section exists
        loadCalendar(currentDate);
    }

});
