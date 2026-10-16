// =====================================
// POCKETWISE EXPENSE TRACKER
// =====================================


// GET HTML ELEMENTS

const slides = Array.from(
    document.querySelectorAll(".slide")
);

const dots = Array.from(
    document.querySelectorAll(".dot")
);

const stepLabel = document.getElementById("stepLabel");

const progressPercent = document.getElementById(
    "progressPercent"
);

const progressFill = document.getElementById(
    "progressFill"
);

const progressBar = document.getElementById(
    "progressBar"
);

const backButton = document.getElementById(
    "backButton"
);

const nextButton = document.getElementById(
    "nextButton"
);

const navRow = document.getElementById("navRow");

const toast = document.getElementById("toast");

const totalIncomeElement = document.getElementById(
    "totalIncome"
);

const totalExpensesElement = document.getElementById(
    "totalExpenses"
);

const balanceElement = document.getElementById(
    "balance"
);

const balanceNote = document.getElementById(
    "balanceNote"
);

const transactionList = document.getElementById(
    "transactionList"
);

const transactionCount = document.getElementById(
    "transactionCount"
);


// STORAGE

const STORAGE_KEY = "pocketwise.transactions.v1";

let currentSlide = 0;

let toastTimeout;

let transactions = loadTransactions();


// CURRENCY FORMAT

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});


// =====================================
// DATE FUNCTIONS
// =====================================

function localDateString(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// SET DEFAULT DATE TO TODAY

const today = localDateString();

document.getElementById("incomeDate").value = today;

document.getElementById("expenseDate").value = today;

document.getElementById("incomeDate").max = today;

document.getElementById("expenseDate").max = today;


// =====================================
// LOAD SAVED TRANSACTIONS
// =====================================

function loadTransactions() {

    try {

        const savedData = localStorage.getItem(STORAGE_KEY);

        const parsed = JSON.parse(savedData || "[]");

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(item =>

            item &&

            typeof item.id === "string" &&

            typeof item.description === "string" &&

            Number.isFinite(item.amount) &&

            item.amount > 0 &&

            (
                item.type === "income" ||
                item.type === "expense"
            ) &&

            typeof item.date === "string" &&

            /^\d{4}-\d{2}-\d{2}$/.test(item.date)

        );

    } catch (error) {

        return [];

    }

}


// =====================================
// SAVE TRANSACTIONS
// =====================================

function persistTransactions() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

        return true;

    } catch (error) {

        showToast(
            "Could not save. Browser storage may be unavailable or full."
        );

        return false;

    }

}


// =====================================
// SHOW NOTIFICATION
// =====================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);

}


// =====================================
// SLIDE NAVIGATION
// =====================================

function showSlide(index) {

    currentSlide = Math.max(
        0,
        Math.min(index, slides.length - 1)
    );

    slides.forEach((slide, i) => {

        const active = i === currentSlide;

        slide.hidden = !active;

        slide.classList.toggle("active", active);

    });


    // UPDATE PROGRESS

    const percent = Math.round(
        ((currentSlide + 1) / slides.length) * 100
    );

    stepLabel.textContent =
        `STEP ${currentSlide + 1} OF ${slides.length}`;

    progressPercent.textContent = `${percent}%`;

    progressFill.style.width = `${percent}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        String(percent)
    );


    // UPDATE SLIDE DOTS

    dots.forEach((dot, i) => {

        dot.classList.toggle(
            "active-dot",
            i === currentSlide
        );

    });


    // UPDATE BUTTONS

    backButton.disabled = currentSlide === 0;

    nextButton.hidden =
        currentSlide === slides.length - 1;

    navRow.hidden = false;

    nextButton.innerHTML =
        'Next <span aria-hidden="true">→</span>';

}


// NEXT BUTTONS

document.querySelectorAll("[data-next]").forEach(button => {

    button.addEventListener("click", () => {

        showSlide(currentSlide + 1);

    });

});


// GO DIRECTLY TO INCOME OR EXPENSE SLIDE

document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

        showSlide(Number(button.dataset.go));

    });

});


// BACK BUTTON

backButton.addEventListener("click", () => {

    showSlide(currentSlide - 1);

});


// NEXT BUTTON

nextButton.addEventListener("click", () => {

    showSlide(currentSlide + 1);

});


// =====================================
// CREATE TRANSACTION ID
// =====================================

function createId() {

    if (
        globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === "function"
    ) {

        return globalThis.crypto.randomUUID();

    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;

}


// =====================================
// ADD INCOME OR EXPENSE
// =====================================

function addTransaction(form, type) {

    form.addEventListener("submit", event => {

        event.preventDefault();


        // GET INPUT ELEMENTS

        const descriptionInput = form.elements.description;

        const amountInput = form.elements.amount;

        const dateInput = form.elements.date;


        // READ USER INPUT

        const description = descriptionInput.value.trim();

        const amount = Number(amountInput.value);

        const date = dateInput.value;


        // VALIDATE DESCRIPTION

        if (!description) {

            showToast("Please enter a description.");

            descriptionInput.focus();

            return;

        }


        // VALIDATE AMOUNT

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 100000000
        ) {

            showToast("Enter an amount greater than ₹0.");

            amountInput.focus();

            return;

        }


        // VALIDATE DATE

        if (!date || date > localDateString()) {

            showToast(
                "Please choose a valid date that is not in the future."
            );

            dateInput.focus();

            return;

        }


        // CREATE TRANSACTION OBJECT

        const safeAmount = Math.round(
            (amount + Number.EPSILON) * 100
        ) / 100;

        const item = {

            id: createId(),

            description: description,

            amount: safeAmount,

            type: type,

            date: date

        };


        // ADD TRANSACTION

        transactions.push(item);


        // SAVE TRANSACTION

        if (!persistTransactions()) {

            transactions = transactions.filter(
                transaction => transaction.id !== item.id
            );

            return;

        }


        // RESET FORM

        form.reset();

        dateInput.value = localDateString();


        // UPDATE DASHBOARD

        renderDashboard();


        // SHOW MESSAGE

        showToast(
            type === "income"
                ? "Income saved successfully."
                : "Expense saved successfully."
        );


        // OPEN DASHBOARD

        showSlide(3);

    });

}


// CONNECT INCOME FORM

addTransaction(
    document.getElementById("incomeForm"),
    "income"
);


// CONNECT EXPENSE FORM

addTransaction(
    document.getElementById("expenseForm"),
    "expense"
);


// =====================================
// FORMAT DATE FOR DISPLAY
// =====================================

function formatDate(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return new Intl.DateTimeFormat("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric"

    }).format(date);

}


// =====================================
// UPDATE DASHBOARD
// =====================================

function renderDashboard() {


    // CALCULATE TOTAL INCOME

    const income = transactions

        .filter(item => item.type === "income")

        .reduce(
            (sum, item) => sum + item.amount,
            0
        );


    // CALCULATE TOTAL EXPENSES

    const expenses = transactions

        .filter(item => item.type === "expense")

        .reduce(
            (sum, item) => sum + item.amount,
            0
        );


    // CALCULATE REMAINING BALANCE

    const balance = Math.round(
        (income - expenses + Number.EPSILON) * 100
    ) / 100;


    // DISPLAY TOTALS

    totalIncomeElement.textContent =
        currency.format(income);

    totalExpensesElement.textContent =
        currency.format(expenses);

    balanceElement.textContent =
        currency.format(balance);


    // UPDATE BALANCE NOTE

    balanceNote.textContent =
        balance < 0
            ? "Expenses are higher than income"
            : "Income minus expenses";


    // UPDATE TRANSACTION COUNT

    transactionCount.textContent =
        `${transactions.length} ${
            transactions.length === 1 ? "record" : "records"
        }`;


    // CLEAR OLD TRANSACTIONS

    transactionList.replaceChildren();


    // SORT NEWEST TRANSACTIONS FIRST

    const sorted = [...transactions].sort((a, b) =>

        b.date.localeCompare(a.date) ||

        b.id.localeCompare(a.id)

    );


    // SHOW EMPTY MESSAGE

    if (sorted.length === 0) {

        const empty = document.createElement("li");

        empty.className = "empty-state";


        const icon = document.createElement("span");

        icon.className = "empty-icon";

        icon.textContent = "↗";


        const title = document.createElement("strong");

        title.textContent = "No transactions yet";


        const message = document.createElement("span");

        message.textContent =
            "Add income or expenses to see them here.";


        empty.append(
            icon,
            title,
            message
        );

        transactionList.appendChild(empty);

        return;

    }


    // DISPLAY EACH TRANSACTION

    sorted.forEach(item => {

        const li = document.createElement("li");

        li.className = "transaction-item";


        // TRANSACTION MAIN SECTION

        const main = document.createElement("div");

        main.className = "transaction-main";


        // ICON

        const icon = document.createElement("span");

        icon.className =
            `transaction-icon ${
                item.type === "expense" ? "expense" : ""
            }`;

        icon.textContent =
            item.type === "income" ? "↗" : "↘";


        // DETAILS

        const details = document.createElement("div");

        details.className = "transaction-details";


        const title = document.createElement("strong");

        title.textContent = item.description;


        const meta = document.createElement("small");

        meta.textContent =
            `${formatDate(item.date)} · ${
                item.type === "income" ? "Income" : "Expense"
            }`;


        details.append(title, meta);

        main.append(icon, details);


        // AMOUNT AND DELETE BUTTON

        const side = document.createElement("div");

        side.className = "transaction-side";


        const value = document.createElement("span");

        value.className =
            `transaction-value ${item.type}`;

        value.textContent =
            `${item.type === "income" ? "+" : "−"}${
                currency.format(item.amount)
            }`;


        const remove = document.createElement("button");

        remove.type = "button";

        remove.className = "delete-button";

        remove.textContent = "Delete";

        remove.setAttribute(
            "aria-label",
            `Delete ${item.description}`
        );


        remove.addEventListener("click", () => {

            deleteTransaction(item.id);

        });


        side.append(value, remove);

        li.append(main, side);

        transactionList.appendChild(li);

    });

}


// =====================================
// DELETE TRANSACTION
// =====================================

function deleteTransaction(id) {

    const previous = transactions;

    transactions = transactions.filter(
        item => item.id !== id
    );


    if (!persistTransactions()) {

        transactions = previous;

        return;

    }


    renderDashboard();

    showToast("Transaction deleted.");

}


// =====================================
// EXPORT TRANSACTIONS AS CSV
// =====================================

document.getElementById("exportButton")
    .addEventListener("click", () => {


        // CHECK WHETHER DATA EXISTS

        if (transactions.length === 0) {

            showToast(
                "Add at least one transaction before exporting."
            );

            return;

        }


        // PREPARE CSV ROWS

        const rows = [

            [
                "Description",
                "Type",
                "Amount (INR)",
                "Date"
            ],

            ...transactions.map(item => [

                item.description,

                item.type,

                item.amount.toFixed(2),

                item.date

            ])

        ];


        // CONVERT ROWS TO CSV TEXT

        const csv = rows.map(row =>

            row.map(value => {

                const text = String(value);

                return `"${text.replace(/"/g, '""')}"`;

            }).join(",")

        ).join("\r\n");


        // CREATE DOWNLOAD FILE

        const blob = new Blob(

            ["\uFEFF" + csv],

            {
                type: "text/csv;charset=utf-8;"
            }

        );


        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "pocketwise-transactions.csv";


        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        showToast("CSV export downloaded.");

    });


// =====================================
// INITIALIZE APPLICATION
// =====================================

// Display saved transactions when the page opens.

renderDashboard();

// Start from the welcome slide.

showSlide(0);