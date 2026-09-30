const API =
    "http://10.49.217.244:5000/api";

const BOOK_LIMIT = 4;

const STUDENT_PORTAL_URL =
    "https://YOUR-CLEAN-DOMAIN/student";

let studentLoggedIn = null;
let currentBranch = "";
let currentStudent = null;
let currentReport = "";

const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "1234";


// =====================================================
// API HELPER
// =====================================================

async function apiFetch(url, options = {}) {

    const headers =
        options.headers || {};

    const adminToken =
        sessionStorage.getItem(
            "adminToken"
        );

    const studentToken =
        sessionStorage.getItem(
            "studentToken"
        );

    if (adminToken) {

        headers.Authorization =
            "Bearer " + adminToken;
    }

    if (
        studentToken &&
        !adminToken
    ) {

        headers.Authorization =
            "Bearer " + studentToken;
    }

    return fetch(
        url,
        {
            ...options,
            headers
        }
    );
}


// =====================================================
// STORAGE
// =====================================================

function initStorage() {

    if (
        !localStorage.getItem(
            "students"
        )
    ) {
        localStorage.setItem(
            "students",
            JSON.stringify([])
        );
    }

    if (
        !localStorage.getItem(
            "books"
        )
    ) {
        localStorage.setItem(
            "books",
            JSON.stringify([])
        );
    }

    if (
        !localStorage.getItem(
            "deletedStudents"
        )
    ) {
        localStorage.setItem(
            "deletedStudents",
            JSON.stringify([])
        );
    }

    if (
        !localStorage.getItem(
            "libraryLogs"
        )
    ) {
        localStorage.setItem(
            "libraryLogs",
            JSON.stringify([])
        );
    }

    if (
        !localStorage.getItem(
            "bookHistory"
        )
    ) {
        localStorage.setItem(
            "bookHistory",
            JSON.stringify([])
        );
    }
}


// =====================================================
// PAGE LOAD
// =====================================================

window.onload = function () {

    initStorage();

    const adminToken =
        sessionStorage.getItem(
            "adminToken"
        );

    if (adminToken) {

        showAdminDashboard();
    }
};


// =====================================================
// ADMIN LOGIN
// =====================================================

async function login() {

    const id =
        document
            .getElementById("adminId")
            .value
            .trim();

    const password =
        document
            .getElementById("adminPassword")
            .value
            .trim();

    try {

        const response =
            await fetch(
                API + "/admin/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id,
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Invalid Admin ID or Password"
            );

            return;
        }

        sessionStorage.setItem(
            "adminToken",
            data.token
        );

        showAdminDashboard();

        alert(
            "Login successful"
        );

    } catch (error) {

        console.error(error);

        alert(
            "Backend is not running"
        );
    }
}


// =====================================================
// SHOW ADMIN
// =====================================================

function showAdminDashboard() {

    const loginPage =
        document.getElementById(
            "loginPage"
        );

    const dashboardPage =
        document.getElementById(
            "dashboardPage"
        );

    if (loginPage) {

        loginPage.classList.add(
            "hidden"
        );
    }

    if (dashboardPage) {

        dashboardPage.classList.remove(
            "hidden"
        );
    }
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    sessionStorage.removeItem(
        "adminToken"
    );

    location.reload();
}


// =====================================================
// SECTIONS
// =====================================================

function hideSections() {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.add(
                "hidden"
            );
        });
}


function showSection(id) {

    hideSections();

    const section =
        document.getElementById(id);

    if (section) {

        section.classList.remove(
            "hidden"
        );
    }

    if (
        id === "booksSection"
    ) {

        loadBooks();
    }
}


// =====================================================
// REGISTER STUDENT
// =====================================================

async function registerStudent() {

    const name =
        document
            .getElementById("studentName")
            .value
            .trim();

    const roll =
        document
            .getElementById("studentRoll")
            .value
            .trim();

    const phone =
        document
            .getElementById("studentPhone")
            .value
            .trim();

    const branch =
        document
            .getElementById("studentBranch")
            .value;

    const photoFile =
        document
            .getElementById(
                "studentPhoto"
            )
            .files[0];

    if (
        !name ||
        !roll ||
        !phone ||
        !branch ||
        !photoFile
    ) {

        alert(
            "Please fill all fields"
        );

        return;
    }

    const reader =
        new FileReader();

    reader.onload =
        async function (e) {

            try {

                const response =
                    await apiFetch(
                        API + "/students",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    roll,
                                    phone,
                                    branch,
                                    photo:
                                        e.target.result
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.error ||
                        "Failed to register student"
                    );

                    return;
                }

                alert(
                    "Student registered successfully"
                );

                document
                    .getElementById(
                        "studentName"
                    ).value = "";

                document
                    .getElementById(
                        "studentRoll"
                    ).value = "";

                document
                    .getElementById(
                        "studentPhone"
                    ).value = "";

                document
                    .getElementById(
                        "studentPhoto"
                    ).value = "";

            } catch (error) {

                console.error(error);

                alert(
                    "Backend is not running"
                );
            }
        };

    reader.readAsDataURL(
        photoFile
    );
}


// =====================================================
// ADD BOOK
// =====================================================

async function addBook() {

    const serial =
        document
            .getElementById("bookSerial")
            .value
            .trim();

    const name =
        document
            .getElementById("bookName")
            .value
            .trim();

    const author =
        document
            .getElementById("bookAuthor")
            .value
            .trim();

    const totalCopies =
        parseInt(
            document
                .getElementById(
                    "bookCopies"
                )
                .value
        );

    if (
        !serial ||
        !name ||
        !author ||
        !totalCopies
    ) {

        alert(
            "Fill all fields properly"
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                API + "/books",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            serial,
                            name,
                            author,
                            totalCopies
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to add book"
            );

            return;
        }

        alert(
            "Book Added Successfully"
        );

        document
            .getElementById(
                "bookSerial"
            ).value = "";

        document
            .getElementById(
                "bookName"
            ).value = "";

        document
            .getElementById(
                "bookAuthor"
            ).value = "";

        document
            .getElementById(
                "bookCopies"
            ).value = "";

        loadBooks();

    } catch (error) {

        console.error(error);

        alert(
            "Backend is not running"
        );
    }
}


// =====================================================
// LOAD BOOKS
// =====================================================

async function loadBooks() {

    try {

        const response =
            await apiFetch(
                API + "/books"
            );

        if (!response.ok) {

            throw new Error(
                "Failed to fetch books"
            );
        }

        const books =
            await response.json();

        renderBooks(books);

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load books. Check backend."
        );
    }
}


// =====================================================
// RENDER BOOKS
// =====================================================

function renderBooks(books) {

    let html = "";

    books.forEach(book => {

        const issued =
            book.total_copies -
            book.available_copies;

        html += `
        <tr>

            <td>${book.serial}</td>

            <td
                onclick="showBookHistory('${book.serial}')"
                style="cursor:pointer;color:blue;">
                ${book.name}
            </td>

            <td>
                ${book.author || "-"}
            </td>

            <td>
                ${book.total_copies}
            </td>

            <td>
                ${issued}
            </td>

            <td>
                ${book.available_copies}
            </td>

            <td>
                <button
                    onclick="deleteBook('${book.serial}')">
                    Delete
                </button>
            </td>

        </tr>
        `;
    });

    document
        .getElementById(
            "booksTable"
        ).innerHTML = html;
}


// =====================================================
// SEARCH BOOK
// =====================================================

async function searchBook() {

    const searchText =
        document
            .getElementById(
                "bookSearchBox"
            )
            .value
            .toLowerCase();

    try {

        const response =
            await apiFetch(
                API + "/books"
            );

        const books =
            await response.json();

        const filtered =
            books.filter(
                book =>
                    book.name
                        .toLowerCase()
                        .includes(
                            searchText
                        )
            );

        renderBooks(filtered);

    } catch (error) {

        console.error(error);
    }
}


// =====================================================
// DATE
// =====================================================

function formatDate(date) {

    if (!date) {

        return "-";
    }

    return String(date)
        .split("T")[0];
}


// =====================================================
// BOOK HISTORY
// =====================================================

async function showBookHistory(
    serial
) {

    hideSections();

    document
        .getElementById(
            "bookHistorySection"
        )
        .classList.remove(
            "hidden"
        );

    const table =
        document.getElementById(
            "bookHistoryTable"
        );

    table.innerHTML = "";

    try {

        const [
            bookResponse,
            historyResponse
        ] =
            await Promise.all([

                apiFetch(
                    API +
                    "/books/" +
                    encodeURIComponent(
                        serial
                    )
                ),

                apiFetch(
                    API +
                    "/books/" +
                    encodeURIComponent(
                        serial
                    ) +
                    "/history"
                )
            ]);

        const book =
            await bookResponse.json();

        const records =
            await historyResponse.json();

        if (!bookResponse.ok) {

            alert(
                book.error ||
                "Failed to load book"
            );

            return;
        }

        if (!historyResponse.ok) {

            alert(
                records.error ||
                "Failed to load book history"
            );

            return;
        }

        const title =
            document.querySelector(
                "#bookHistorySection h2"
            );

        if (title) {

            title.textContent =
                "Book Borrowing History — " +
                book.name;
        }

        records.forEach(
            (record, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>${index + 1}</td>

                    <td>
                        ${record.student_name}
                    </td>

                    <td>
                        ${record.roll}
                    </td>

                    <td>
                        ${formatDate(
                            record.issue_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            record.return_date
                        )}
                    </td>

                    <td>
                        ${record.status}
                    </td>
                `;

                table.appendChild(row);
            }
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load book history."
        );
    }
}


// =====================================================
// DELETE BOOK
// =====================================================

async function deleteBook(
    serial
) {

    if (
        !confirm(
            "Delete this book?"
        )
    ) {
        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/books/" +
                encodeURIComponent(
                    serial
                ),
                {
                    method:
                        "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to delete book"
            );

            return;
        }

        alert(
            "Book Deleted Successfully"
        );

        loadBooks();

    } catch (error) {

        console.error(error);

        alert(
            "Backend is not running"
        );
    }
}


// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents(
    branch
) {

    currentBranch =
        branch;

    hideSections();

    document
        .getElementById(
            "studentsSection"
        )
        .classList.remove(
            "hidden"
        );

    try {

        const response =
            await apiFetch(
                API + "/students"
            );

        const students =
            await response.json();

        if (!response.ok) {

            alert(
                "Failed to load students"
            );

            return;
        }

        const filtered =
            students.filter(
                student =>
                    student.branch ===
                    branch
            );

        renderStudents(
            filtered
        );

    } catch (error) {

        console.error(error);

        alert(
            "Backend is not running"
        );
    }
}


// =====================================================
// RENDER STUDENTS
// =====================================================

function renderStudents(
    students
) {

    const table =
        document.getElementById(
            "studentsTable"
        );

    table.innerHTML = "";

    students.forEach(
        (student, index) => {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <button
                        onclick="showProfile('${student.roll}')">
                        ${student.name}
                    </button>
                </td>

                <td>
                    ${student.roll}
                </td>

                <td>
                    ${student.phone || "-"}
                </td>

                <td>

                    <button
                        onclick="generateStudentQR('${student.roll}')">
                        Generate QR
                    </button>

                    <button
                        onclick="deleteStudent(${student.id})">
                        Delete
                    </button>

                </td>
            `;

            table.appendChild(row);
        }
    );
}


// =====================================================
// SEARCH STUDENT
// =====================================================

async function searchStudent() {

    const search =
        document
            .getElementById(
                "searchBox"
            )
            .value
            .trim()
            .toLowerCase();

    try {

        const response =
            await apiFetch(
                API + "/students"
            );

        const students =
            await response.json();

        const filtered =
            students.filter(
                student =>

                    student.branch ===
                    currentBranch &&

                    student.roll
                        .toLowerCase()
                        .includes(
                            search
                        )
            );

        renderStudents(
            filtered
        );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to search students"
        );
    }
}


// =====================================================
// STUDENT PROFILE
// =====================================================

async function showProfile(
    roll
) {

    if (
        !sessionStorage.getItem(
            "adminToken"
        )
    ) {

        alert(
            "Admin login required"
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/students/" +
                encodeURIComponent(
                    roll
                )
            );

        const student =
            await response.json();

        if (!response.ok) {

            alert(
                student.error ||
                "Student not found"
            );

            return;
        }

        currentStudent =
            student;

        hideSections();

        document
            .getElementById(
                "profileSection"
            )
            .classList.remove(
                "hidden"
            );

        document
            .getElementById(
                "profileName"
            ).innerText =
                currentStudent.name;

        document
            .getElementById(
                "profileRoll"
            ).innerText =
                "Roll: " +
                currentStudent.roll;

        document
            .getElementById(
                "profilePhone"
            ).innerText =
                "Phone: " +
                (
                    currentStudent.phone ||
                    "-"
                );

        document
            .getElementById(
                "profileBranch"
            ).innerText =
                "Branch: " +
                currentStudent.branch;

        document
            .getElementById(
                "profilePhoto"
            ).src =
                currentStudent.photo ||
                "https://via.placeholder.com/120";

        await loadIssuedBooks();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load student profile"
        );
    }
}


// =====================================================
// LOAD ISSUED BOOKS
// =====================================================

async function loadIssuedBooks() {

    const table =
        document.getElementById(
            "issuedTable"
        );

    table.innerHTML = "";

    if (!currentStudent) {

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/students/" +
                encodeURIComponent(
                    currentStudent.roll
                ) +
                "/history"
            );

        const books =
            await response.json();

        if (!response.ok) {

            alert(
                books.error ||
                "Failed to load book history"
            );

            return;
        }

        const issuedBooks =
            books.filter(
                book =>
                    book.status ===
                    "Issued"
            ).length;

        document
            .getElementById(
                "bookLimit"
            ).textContent =
                "Books Issued: " +
                issuedBooks +
                " / " +
                BOOK_LIMIT;

        books.forEach(
            (book, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${book.book_name}
                    </td>

                    <td>
                        ${book.author || "-"}
                    </td>

                    <td>
                        ${formatDate(
                            book.issue_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            book.due_date
                        )}
                    </td>

                    <td>
                        ${book.status}
                    </td>

                    <td>
                        ${formatDate(
                            book.return_date
                        )}
                    </td>

                    <td>

                        ${
                            book.status ===
                            "Issued"

                            ?

                            `<button
                                onclick="returnBook(${book.transaction_id})">
                                Return
                            </button>`

                            :

                            "-"
                        }

                    </td>
                `;

                table.appendChild(row);
            }
        );

        updateIssueButton(
            issuedBooks
        );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load issued books."
        );
    }
}


// =====================================================
// ISSUE BUTTON
// =====================================================

function updateIssueButton(
    issuedBooks
) {

    const buttons =
        document.querySelectorAll(
            '#profileSection > button[onclick="showIssueBook()"]'
        );

    buttons.forEach(
        button => {

            if (
                issuedBooks >=
                BOOK_LIMIT
            ) {

                button.disabled =
                    true;

                button.textContent =
                    "Book Limit Reached (4 / 4)";

            } else {

                button.disabled =
                    false;

                button.textContent =
                    "Issue Book";
            }
        }
    );
}


// =====================================================
// SHOW ISSUE BOOK
// =====================================================

async function showIssueBook() {

    if (!currentStudent) {

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/students/" +
                encodeURIComponent(
                    currentStudent.roll
                ) +
                "/history"
            );

        const history =
            await response.json();

        if (!response.ok) {

            alert(
                history.error ||
                "Unable to check book limit"
            );

            return;
        }

        const issuedBooks =
            history.filter(
                book =>
                    book.status ===
                    "Issued"
            ).length;

        document
            .getElementById(
                "bookLimit"
            ).textContent =
                "Books Issued: " +
                issuedBooks +
                " / " +
                BOOK_LIMIT;

        if (
            issuedBooks >=
            BOOK_LIMIT
        ) {

            alert(
                "This student has reached the maximum book issue limit of 4."
            );

            updateIssueButton(
                issuedBooks
            );

            return;
        }

        document
            .getElementById(
                "issueArea"
            )
            .classList.remove(
                "hidden"
            );

        const today =
            new Date();

        const localDate =
            today.getFullYear() +
            "-" +
            String(
                today.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                today.getDate()
            ).padStart(2, "0");

        const issueDate =
            document.getElementById(
                "issueDate"
            );

        if (issueDate) {

            issueDate.value =
                localDate;
        }

        loadBookOptions();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to check book limit"
        );
    }
}


// =====================================================
// BOOK OPTIONS
// =====================================================

async function loadBookOptions() {

    const select =
        document.getElementById(
            "bookSelect"
        );

    select.innerHTML = "";

    try {

        const response =
            await apiFetch(
                API + "/books"
            );

        const books =
            await response.json();

        books
            .filter(
                book =>
                    book.available_copies > 0
            )
            .forEach(
                book => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        book.serial;

                    option.textContent =
                        book.name +
                        " - " +
                        book.author +
                        " (" +
                        book.available_copies +
                        " available)";

                    select.appendChild(
                        option
                    );
                }
            );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load books"
        );
    }
}


// =====================================================
// SEARCH BOOKS FOR ISSUE
// =====================================================

async function searchBooks() {

    const search =
        document
            .getElementById(
                "bookSearch"
            )
            .value
            .toLowerCase();

    const select =
        document.getElementById(
            "bookSelect"
        );

    select.innerHTML = "";

    try {

        const response =
            await apiFetch(
                API + "/books"
            );

        const books =
            await response.json();

        books
            .filter(
                book =>

                    book.available_copies >
                        0 &&

                    book.name
                        .toLowerCase()
                        .includes(
                            search
                        )
            )
            .forEach(
                book => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        book.serial;

                    option.textContent =
                        book.name +
                        " - " +
                        book.author +
                        " (" +
                        book.available_copies +
                        " available)";

                    select.appendChild(
                        option
                    );
                }
            );

    } catch (error) {

        console.error(error);
    }
}


// =====================================================
// ISSUE BOOK
// =====================================================

async function issueBook() {

    if (!currentStudent) {

        alert(
            "Select a student first"
        );

        return;
    }

    const serial =
        document
            .getElementById(
                "bookSelect"
            )
            .value;

    if (!serial) {

        alert(
            "Please select a book"
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/transactions/issue",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            roll:
                                currentStudent.roll,

                            serial
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to issue book"
            );

            await showProfile(
                currentStudent.roll
            );

            return;
        }

        alert(
            "Book issued successfully.\n\n" +
            "Issue Date: " +
            data.issueDate +
            "\n" +
            "Due Date: " +
            data.dueDate
        );

        document
            .getElementById(
                "issueArea"
            )
            .classList.add(
                "hidden"
            );

        await loadBooks();

        await showProfile(
            currentStudent.roll
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to issue book."
        );
    }
}


// =====================================================
// RETURN BOOK
// =====================================================

async function returnBook(
    transactionId
) {

    if (!currentStudent) {

        return;
    }

    if (
        !confirm(
            "Return this book?"
        )
    ) {

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/transactions/return",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            transactionId
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to return book"
            );

            return;
        }

        alert(
            "Book returned successfully.\n\n" +
            "Return Date: " +
            data.returnDate
        );

        await loadBooks();

        await showProfile(
            currentStudent.roll
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to return book."
        );
    }
}


// =====================================================
// COMPATIBILITY FUNCTIONS
// =====================================================

function updateBookStatus() {

    loadIssuedBooks();
}


function handleReturnBook() {

    loadIssuedBooks();
}


function updateReturnDate() {

    loadIssuedBooks();
}


// =====================================================
// DELETE STUDENT
// =====================================================

async function deleteStudent(
    studentId
) {

    if (
        !confirm(
            "Delete this student?"
        )
    ) {

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/students/" +
                studentId,
                {
                    method:
                        "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to delete student"
            );

            return;
        }

        alert(
            "Student Deleted Successfully"
        );

        await loadStudents(
            currentBranch
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete student."
        );
    }
}


// =====================================================
// QR CODE
// =====================================================

function generateStudentQR(
    roll
) {

    if (!roll) {

        alert(
            "Student roll number not found"
        );

        return;
    }

    const profileURL =
        STUDENT_PORTAL_URL;

    const qrWindow =
        window.open(
            "",
            "_blank"
        );

    if (!qrWindow) {

        alert(
            "Please allow pop-ups for this website."
        );

        return;
    }

    qrWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Student QR - ${roll}
</title>

<style>

body {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 30px;
}

.qr-box {
    max-width: 400px;
    margin: auto;
    padding: 25px;
    border: 1px solid #ddd;
    border-radius: 12px;
}

#qrcode {
    margin: 25px auto;
    width: 256px;
}

button {
    padding: 10px 20px;
    margin: 5px;
    border: none;
    border-radius: 5px;
    background: #2563eb;
    color: white;
    cursor: pointer;
}

@media print {

    button {
        display: none;
    }

}

</style>

<script
src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js">
</script>

</head>

<body>

<div class="qr-box">

<h2>
Student Library QR
</h2>

<h3>
${roll}
</h3>

<div id="qrcode"></div>

<p>
Scan this QR code to open the student library portal.
</p>

<button onclick="window.print()">
Print QR
</button>

</div>

<script>

new QRCode(
    document.getElementById("qrcode"),
    {
        text:
            ${JSON.stringify(profileURL)},

        width: 256,

        height: 256
    }
);

</script>

</body>

</html>

`);

    qrWindow.document.close();
}


// =====================================================
// IMPORT STUDENTS
// =====================================================

async function importStudents() {

    const url =
        "https://script.google.com/macros/s/AKfycbz9cte0vWjY8E5Jc2ird5J6pLtX1MI0fXkBsHYzEj6BBRkgE_ZPdM5OsZ4t5OflVG1M/exec";

    try {

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (
            !Array.isArray(data)
        ) {

            alert(
                "Invalid student data"
            );

            return;
        }

        let importedCount = 0;

        let existingCount = 0;

        let deletedCount = 0;

        for (
            const row of data
        ) {

            if (
                !row ||
                row.length < 5
            ) {

                continue;
            }

            const name =
                String(
                    row[1] || ""
                ).trim();

            const roll =
                String(
                    row[2] || ""
                ).trim();

            const phone =
                String(
                    row[3] || ""
                ).trim();

            const branch =
                String(
                    row[4] || ""
                ).trim();

            let photo =
                String(
                    row[5] || ""
                ).trim();

            if (!name || !roll) {

                continue;
            }

            if (
                photo.includes(
                    "id="
                )
            ) {

                const id =
                    photo
                        .split("id=")[1]
                        .split("&")[0];

                photo =
                    "https://drive.google.com/thumbnail?id=" +
                    id +
                    "&sz=w500";
            }

            const deletedResponse =
                await apiFetch(
                    API +
                    "/students/deleted/" +
                    encodeURIComponent(
                        roll
                    )
                );

            if (
                deletedResponse.ok
            ) {

                deletedCount++;

                continue;
            }

            const mysqlResponse =
                await apiFetch(
                    API +
                    "/students",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name,
                                roll,
                                phone,
                                branch,
                                photo:
                                    photo ||
                                    null
                            })
                    }
                );

            const mysqlData =
                await mysqlResponse.json();

            if (
                mysqlResponse.status ===
                409
            ) {

                existingCount++;

                continue;
            }

            if (
                !mysqlResponse.ok
            ) {

                console.error(
                    "MySQL error:",
                    mysqlData
                );

                continue;
            }

            importedCount++;
        }

        alert(
            importedCount +
            " new students added to MySQL.\n" +
            existingCount +
            " students already existed.\n" +
            deletedCount +
            " deleted students skipped."
        );

        await loadStudentsFromDatabase();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to import students."
        );
    }
}


// =====================================================
// LOAD STUDENTS FROM MYSQL
// =====================================================

async function loadStudentsFromDatabase() {

    try {

        const response =
            await apiFetch(
                API + "/students"
            );

        if (!response.ok) {

            throw new Error(
                "Failed to fetch students"
            );
        }

        const students =
            await response.json();

        localStorage.setItem(
            "students",
            JSON.stringify(
                students
            )
        );

        if (currentBranch) {

            loadStudents(
                currentBranch
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load students from MySQL"
        );
    }
}


// =====================================================
// STUDENT OTP LOGIN
// =====================================================

async function sendStudentOTP() {

    const roll =
        document
            .getElementById(
                "studentLoginRoll"
            )
            .value
            .trim();

    const phone =
        document
            .getElementById(
                "studentLoginPhone"
            )
            .value
            .trim();

    if (!roll || !phone) {

        alert(
            "Enter roll number and registered mobile number"
        );

        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/student/send-otp",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            roll,
                            phone
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Unable to send OTP"
            );

            return;
        }

        alert(
            "OTP sent to your registered mobile number."
        );

        const otpArea =
            document.getElementById(
                "studentOTPArea"
            );

        if (otpArea) {

            otpArea.classList.remove(
                "hidden"
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to backend."
        );
    }
}


// =====================================================
// VERIFY STUDENT OTP
// =====================================================

async function verifyStudentOTP() {

    const roll =
        document
            .getElementById(
                "studentLoginRoll"
            )
            .value
            .trim();

    const phone =
        document
            .getElementById(
                "studentLoginPhone"
            )
            .value
            .trim();

    const otp =
        document
            .getElementById(
                "studentOTP"
            )
            .value
            .trim();

    if (
        !roll ||
        !phone ||
        !otp
    ) {

        alert(
            "Enter the OTP"
        );

        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/student/verify-otp",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            roll,
                            phone,
                            otp
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Invalid OTP"
            );

            return;
        }

        sessionStorage.setItem(
            "studentToken",
            data.token
        );

        studentLoggedIn =
            data.student;

        alert(
            "Student login successful"
        );

        await loadStudentDashboard();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to verify OTP."
        );
    }
}


// =====================================================
// LOAD OWN STUDENT DASHBOARD
// =====================================================

async function loadStudentDashboard() {

    try {

        const response =
            await apiFetch(
                API +
                "/student/dashboard"
            );

        const data =
            await response.json();

        if (!response.ok) {

            sessionStorage.removeItem(
                "studentToken"
            );

            alert(
                data.error ||
                "Student session expired"
            );

            return;
        }

        studentLoggedIn =
            data.student;

        renderStudentHistory(
            data
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load student history."
        );
    }
}


// =====================================================
// RENDER OWN HISTORY
// =====================================================

function renderStudentHistory(
    data
) {

    const table =
        document.getElementById(
            "studentHistoryTable"
        );

    if (!table) {

        return;
    }

    table.innerHTML = "";

    document
        .getElementById(
            "studentNameDisplay"
        )
        ?.replaceChildren(
            document.createTextNode(
                data.student.name
            )
        );

    document
        .getElementById(
            "studentRollDisplay"
        )
        ?.replaceChildren(
            document.createTextNode(
                data.student.roll
            )
        );

    document
        .getElementById(
            "studentBranchDisplay"
        )
        ?.replaceChildren(
            document.createTextNode(
                data.student.branch
            )
        );

    document
        .getElementById(
            "studentBookCount"
        )
        ?.replaceChildren(
            document.createTextNode(
                data.issuedBooks +
                " / " +
                data.bookLimit
            )
        );

    data.history.forEach(
        (record, index) => {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${record.book_name}
                </td>

                <td>
                    ${record.author || "-"}
                </td>

                <td>
                    ${formatDate(
                        record.issue_date
                    )}
                </td>

                <td>
                    ${formatDate(
                        record.due_date
                    )}
                </td>

                <td>
                    ${record.status}
                </td>

                <td>
                    ${formatDate(
                        record.return_date
                    )}
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}


// =====================================================
// STUDENT LOGOUT
// =====================================================

function studentLogout() {

    sessionStorage.removeItem(
        "studentToken"
    );

    studentLoggedIn = null;

    location.reload();
}


// =====================================================
// STUDENT REPORT
// =====================================================

async function downloadMyReport() {

    if (
        !sessionStorage.getItem(
            "studentToken"
        )
    ) {

        alert(
            "Please login first"
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                API +
                "/student/dashboard"
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Unable to load report"
            );

            return;
        }

        let content =
            "Student Library Report\n\n";

        content +=
            "Name: " +
            data.student.name +
            "\n";

        content +=
            "Roll: " +
            data.student.roll +
            "\n";

        content +=
            "Branch: " +
            data.student.branch +
            "\n";

        content +=
            "Current Books: " +
            data.issuedBooks +
            "/" +
            data.bookLimit +
            "\n\n";

        data.history.forEach(
            (record, index) => {

                content +=
                    (index + 1) +
                    ". " +
                    record.book_name +
                    " | Issue: " +
                    formatDate(
                        record.issue_date
                    ) +
                    " | Due: " +
                    formatDate(
                        record.due_date
                    ) +
                    " | Return: " +
                    formatDate(
                        record.return_date
                    ) +
                    " | Status: " +
                    record.status +
                    "\n";
            }
        );

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain"
                }
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            URL.createObjectURL(
                blob
            );

        link.download =
            data.student.roll +
            "_library_report.txt";

        link.click();

        URL.revokeObjectURL(
            link.href
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to download report."
        );
    }
}


// =====================================================
// REPORT
// =====================================================

async function generateSingleReport() {

    const date =
        document
            .getElementById(
                "singleReportDate"
            )
            .value;

    if (!date) {

        alert(
            "Please select a date"
        );

        return;
    }

    await generateLibraryReport(
        date,
        date
    );
}


async function generateRangeReport() {

    const fromDate =
        document
            .getElementById(
                "fromDate"
            )
            .value;

    const toDate =
        document
            .getElementById(
                "toDate"
            )
            .value;

    if (
        !fromDate ||
        !toDate
    ) {

        alert(
            "Please select both dates"
        );

        return;
    }

    if (
        fromDate >
        toDate
    ) {

        alert(
            "From date cannot be after To date"
        );

        return;
    }

    await generateLibraryReport(
        fromDate,
        toDate
    );
}


// =====================================================
// BORROWING COUNTS
// =====================================================

async function getCurrentBorrowingCounts(
    logs
) {

    const rolls =
        [
            ...new Set(
                logs
                    .map(
                        log =>
                            log.roll
                    )
                    .filter(Boolean)
            )
        ];

    const counts = {};

    await Promise.all(
        rolls.map(
            async roll => {

                try {

                    const response =
                        await apiFetch(
                            API +
                            "/students/" +
                            encodeURIComponent(
                                roll
                            ) +
                            "/history"
                        );

                    const history =
                        await response.json();

                    if (!response.ok) {

                        counts[roll] =
                            0;

                        return;
                    }

                    counts[roll] =
                        history.filter(
                            book =>
                                book.status ===
                                "Issued"
                        ).length;

                } catch (error) {

                    console.error(
                        error
                    );

                    counts[roll] =
                        0;
                }
            }
        )
    );

    return counts;
}


// =====================================================
// GENERATE LIBRARY REPORT
// =====================================================

async function generateLibraryReport(
    from,
    to
) {

    try {

        const response =
            await apiFetch(
                API +
                "/reports/library?from=" +
                encodeURIComponent(
                    from
                ) +
                "&to=" +
                encodeURIComponent(
                    to
                )
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to generate report"
            );

            return;
        }

        const borrowingCounts =
            await getCurrentBorrowingCounts(
                data.logs || []
            );

        data.borrowingCounts =
            borrowingCounts;

        data.bookLimit =
            BOOK_LIMIT;

        currentReport =
            data;

        let output =
            "COLLEGE LIBRARY MANAGEMENT SYSTEM\n";

        output +=
            "LIBRARY ACTIVITY REPORT\n\n";

        output +=
            "From: " +
            data.from +
            "\n";

        output +=
            "To: " +
            data.to +
            "\n";

        output +=
            "Total Activities: " +
            data.total +
            "\n";

        output +=
            "Maximum Books Per Student: " +
            BOOK_LIMIT +
            "\n\n";

        if (
            !data.logs ||
            data.logs.length === 0
        ) {

            output +=
                "No library activity found for the selected date(s).";

        } else {

            data.logs.forEach(
                (log, index) => {

                    const currentCount =
                        borrowingCounts[
                            log.roll
                        ] || 0;

                    output +=
                        (index + 1) +
                        ". " +
                        log.date +
                        " | " +
                        log.operation +
                        " | " +
                        log.student_name +
                        " | " +
                        log.roll +
                        " | " +
                        log.book_name +
                        " | Current Books: " +
                        currentCount +
                        "/" +
                        BOOK_LIMIT +
                        "\n";
                }
            );
        }

        document
            .getElementById(
                "reportOutput"
            ).textContent =
                output;

    } catch (error) {

        console.error(error);

        alert(
            "Unable to generate report."
        );
    }
}


// =====================================================
// PDF REPORT
// =====================================================

function downloadReport() {

    if (
        !currentReport ||
        !currentReport.logs
    ) {

        alert(
            "Please generate a report first"
        );

        return;
    }

    const {
        jsPDF
    } = window.jspdf;

    const doc =
        new jsPDF();

    const logs =
        currentReport.logs;

    const issued =
        logs.filter(
            log =>
                log.operation ===
                "Issued"
        );

    const returned =
        logs.filter(
            log =>
                log.operation ===
                "Returned"
        );

    const dates =
        [
            ...new Set(
                logs.map(
                    log =>
                        log.date
                )
            )
        ].sort();

    const borrowingCounts =
        currentReport
            .borrowingCounts || {};

    const logo =
        new Image();

    logo.src =
        "logo.png";

    logo.onload =
        function () {

            createReport(
                doc,
                logo
            );
        };

    logo.onerror =
        function () {

            createReport(
                doc,
                null
            );
        };


    function createReport(
        doc,
        logo
    ) {

        if (logo) {

            doc.addImage(
                logo,
                "PNG",
                85,
                10,
                40,
                40
            );
        }

        doc.setFontSize(18);

        doc.text(
            "UCEN JNTUK",
            105,
            58,
            {
                align:
                    "center"
            }
        );

        doc.setFontSize(14);

        doc.text(
            "Central Library",
            105,
            67,
            {
                align:
                    "center"
            }
        );

        doc.setFontSize(16);

        doc.text(
            "Library Activity Report",
            105,
            77,
            {
                align:
                    "center"
            }
        );

        doc.setFontSize(9);

        doc.text(
            "Generated On: " +
            new Date()
                .toLocaleString(),
            105,
            87,
            {
                align:
                    "center"
            }
        );


        doc.autoTable({

            startY: 96,

            head: [[
                "Books Issued",
                "Books Returned",
                "Total Transactions"
            ]],

            body: [[
                issued.length,
                returned.length,
                logs.length
            ]],

            theme:
                "grid",

            styles: {
                fontSize: 10,
                halign:
                    "center"
            },

            headStyles: {
                halign:
                    "center"
            }
        });


        let y =
            doc.lastAutoTable.finalY +
            15;


        doc.setFontSize(10);

        doc.text(
            "Maximum Books Per Student: " +
            BOOK_LIMIT,
            14,
            y
        );

        y += 12;


        dates.forEach(
            date => {

                const dateLogs =
                    logs.filter(
                        log =>
                            log.date ===
                            date
                    );

                const dateIssued =
                    dateLogs.filter(
                        log =>
                            log.operation ===
                            "Issued"
                    );

                const dateReturned =
                    dateLogs.filter(
                        log =>
                            log.operation ===
                            "Returned"
                    );


                if (y > 235) {

                    doc.addPage();

                    y = 20;
                }


                doc.setFontSize(12);

                doc.text(
                    "Date : " +
                    date,
                    14,
                    y
                );

                y += 8;


                doc.setFontSize(10);

                doc.text(
                    "Books Issued : " +
                    dateIssued.length,
                    14,
                    y
                );

                y += 6;

                doc.text(
                    "Books Returned : " +
                    dateReturned.length,
                    14,
                    y
                );

                y += 8;


                if (
                    dateIssued.length >
                    0
                ) {

                    doc.autoTable({

                        startY: y,

                        head: [[
                            "Issued Book",
                            "Student Name",
                            "Roll Number",
                            "Current Books"
                        ]],

                        body:
                            dateIssued.map(
                                log => [

                                    log.book_name ||
                                        "-",

                                    log.student_name ||
                                        "-",

                                    log.roll ||
                                        "-",

                                    (
                                        borrowingCounts[
                                            log.roll
                                        ] || 0
                                    ) +
                                    "/" +
                                    BOOK_LIMIT
                                ]
                            ),

                        theme:
                            "grid",

                        styles: {
                            fontSize:
                                8
                        }
                    });

                    y =
                        doc
                            .lastAutoTable
                            .finalY +
                        12;
                }


                if (
                    dateReturned.length >
                    0
                ) {

                    if (y > 235) {

                        doc.addPage();

                        y = 20;
                    }

                    doc.autoTable({

                        startY: y,

                        head: [[
                            "Returned Book",
                            "Student Name",
                            "Roll Number",
                            "Current Books"
                        ]],

                        body:
                            dateReturned.map(
                                log => [

                                    log.book_name ||
                                        "-",

                                    log.student_name ||
                                        "-",

                                    log.roll ||
                                        "-",

                                    (
                                        borrowingCounts[
                                            log.roll
                                        ] || 0
                                    ) +
                                    "/" +
                                    BOOK_LIMIT
                                ]
                            ),

                        theme:
                            "grid",

                        styles: {
                            fontSize:
                                8
                        }
                    });

                    y =
                        doc
                            .lastAutoTable
                            .finalY +
                        12;
                }
            }
        );


        const pageHeight =
            doc.internal
                .pageSize
                .getHeight();

        const pageWidth =
            doc.internal
                .pageSize
                .getWidth();


        if (
            y >
            pageHeight - 50
        ) {

            doc.addPage();
        }


        const signatureY =
            doc.internal
                .pageSize
                .getHeight() -
            25;


        doc.setFontSize(10);

        doc.text(
            "Librarian Signature",
            pageWidth - 55,
            signatureY,
            {
                align:
                    "center"
            }
        );

        doc.line(
            pageWidth - 80,
            signatureY - 5,
            pageWidth - 30,
            signatureY - 5
        );


        doc.save(
            "library_report_" +
            currentReport.from +
            "_to_" +
            currentReport.to +
            ".pdf"
        );
    }
}