const API = "http://10.49.217.244:5000/api";

const BOOK_LIMIT = 4;

let studentLoggedIn = null;
let otpStore = null;

const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "1234";

let currentBranch = "";
let currentStudent = null;
let currentReport = "";


// ================= STORAGE =================

function initStorage() {

    if (!localStorage.getItem("students")) {
        localStorage.setItem("students", JSON.stringify([]));
    }

    if (!localStorage.getItem("books")) {
        localStorage.setItem("books", JSON.stringify([]));
    }

    if (!localStorage.getItem("deletedStudents")) {
        localStorage.setItem("deletedStudents", JSON.stringify([]));
    }

    if (!localStorage.getItem("libraryLogs")) {
        localStorage.setItem("libraryLogs", JSON.stringify([]));
    }

    if (!localStorage.getItem("bookHistory")) {
        localStorage.setItem("bookHistory", JSON.stringify([]));
    }
}


// ================= PAGE LOAD =================

window.onload = function () {

    initStorage();

    if (sessionStorage.getItem("isLoggedIn") === "true") {

        document.getElementById("loginPage").classList.add("hidden");

        document.getElementById("dashboardPage").classList.remove("hidden");
    }
};


// ================= LOGIN =================

function login() {

    const id =
        document.getElementById("adminId").value.trim();

    const password =
        document.getElementById("adminPassword").value.trim();

    if (id === ADMIN_ID && password === ADMIN_PASSWORD) {

        sessionStorage.setItem("isLoggedIn", "true");

        document.getElementById("loginPage").classList.add("hidden");

        document.getElementById("dashboardPage").classList.remove("hidden");

        alert("Login successful");

    } else {

        alert("Invalid Admin ID or Password");
    }
}


// ================= LOGOUT =================

function logout() {

    sessionStorage.removeItem("isLoggedIn");

    location.reload();
}


// ================= SECTIONS =================

function hideSections() {

    document.querySelectorAll(".section").forEach(section => {

        section.classList.add("hidden");

    });
}


function showSection(id) {

    hideSections();

    const section =
        document.getElementById(id);

    if (section) {
        section.classList.remove("hidden");
    }

    if (id === "booksSection") {
        loadBooks();
    }
}


// ================= REGISTER STUDENT =================

async function registerStudent() {

    const name =
        document.getElementById("studentName").value.trim();

    const roll =
        document.getElementById("studentRoll").value.trim();

    const phone =
        document.getElementById("studentPhone").value.trim();

    const branch =
        document.getElementById("studentBranch").value;

    const photoFile =
        document.getElementById("studentPhoto").files[0];

    if (!name || !roll || !phone || !branch || !photoFile) {

        alert("Please fill all fields");

        return;
    }

    const reader = new FileReader();

    reader.onload = async function (e) {

        try {

            const response =
                await fetch(API + "/students", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name: name,
                        roll: roll,
                        phone: phone,
                        branch: branch,
                        photo: e.target.result

                    })
                });

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to register student"
                );

                return;
            }

            alert("Student registered successfully");

            document.getElementById("studentName").value = "";
            document.getElementById("studentRoll").value = "";
            document.getElementById("studentPhone").value = "";
            document.getElementById("studentPhoto").value = "";

        } catch (error) {

            console.error(error);

            alert("Backend is not running");
        }
    };

    reader.readAsDataURL(photoFile);
}


// ================= ADD BOOK =================

async function addBook() {

    const serial =
        document.getElementById("bookSerial").value.trim();

    const name =
        document.getElementById("bookName").value.trim();

    const author =
        document.getElementById("bookAuthor").value.trim();

    const totalCopies =
        parseInt(
            document.getElementById("bookCopies").value
        );

    if (!serial || !name || !author || !totalCopies) {

        alert("Fill all fields properly");

        return;
    }

    try {

        const response =
            await fetch(API + "/books", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    serial: serial,
                    name: name,
                    author: author,
                    totalCopies: totalCopies

                })
            });

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to add book"
            );

            return;
        }

        alert("Book Added Successfully");

        document.getElementById("bookSerial").value = "";
        document.getElementById("bookName").value = "";
        document.getElementById("bookAuthor").value = "";
        document.getElementById("bookCopies").value = "";

        loadBooks();

    } catch (error) {

        console.error(error);

        alert("Backend is not running");
    }
}


// ================= LOAD BOOKS =================

async function loadBooks() {

    try {

        const response =
            await fetch(API + "/books");

        if (!response.ok) {
            throw new Error("Failed to fetch books");
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


// ================= RENDER BOOKS =================

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

            <td>${book.author || "-"}</td>

            <td>${book.total_copies}</td>

            <td>${issued}</td>

            <td>${book.available_copies}</td>

            <td>
                <button
                    onclick="deleteBook('${book.serial}')">
                    Delete
                </button>
            </td>

        </tr>
        `;
    });

    document.getElementById("booksTable").innerHTML =
        html;
}


// ================= SEARCH BOOK =================

async function searchBook() {

    const searchText =
        document
            .getElementById("bookSearchBox")
            .value
            .toLowerCase();

    try {

        const response =
            await fetch(API + "/books");

        const books =
            await response.json();

        const filtered =
            books.filter(book =>
                book.name
                    .toLowerCase()
                    .includes(searchText)
            );

        renderBooks(filtered);

    } catch (error) {

        console.error(error);
    }
}


// ================= DATE FORMAT =================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    return String(date).split("T")[0];
}


// ================= BOOK HISTORY =================

async function showBookHistory(serial) {

    hideSections();

    document
        .getElementById("bookHistorySection")
        .classList.remove("hidden");

    const table =
        document.getElementById("bookHistoryTable");

    table.innerHTML = "";

    try {

        const [bookResponse, historyResponse] =
            await Promise.all([

                fetch(
                    API +
                    "/books/" +
                    encodeURIComponent(serial)
                ),

                fetch(
                    API +
                    "/books/" +
                    encodeURIComponent(serial) +
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

        records.forEach((record, index) => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${index + 1}</td>

                <td>${record.student_name}</td>

                <td>${record.roll}</td>

                <td>${formatDate(record.issue_date)}</td>

                <td>${formatDate(record.return_date)}</td>

                <td>${record.status}</td>

            `;

            table.appendChild(row);
        });

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load book history.\n" +
            "Make sure the backend is running."
        );
    }
}


// ================= DELETE BOOK =================

async function deleteBook(serial) {

    if (!confirm("Delete this book?")) {
        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/books/" +
                encodeURIComponent(serial),
                {
                    method: "DELETE"
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

        alert("Book Deleted Successfully");

        loadBooks();

    } catch (error) {

        console.error(error);

        alert("Backend is not running");
    }
}


// ================= LOAD STUDENTS =================

async function loadStudents(branch) {

    currentBranch = branch;

    hideSections();

    document
        .getElementById("studentsSection")
        .classList.remove("hidden");

    try {

        const response =
            await fetch(API + "/students");

        const students =
            await response.json();

        if (!response.ok) {

            alert("Failed to load students");

            return;
        }

        const filtered =
            students.filter(student =>
                student.branch === branch
            );

        renderStudents(filtered);

    } catch (error) {

        console.error(error);

        alert("Backend is not running");
    }
}


// ================= RENDER STUDENTS =================

function renderStudents(students) {

    const table =
        document.getElementById("studentsTable");

    table.innerHTML = "";

    students.forEach((student, index) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${index + 1}</td>

            <td>
                <button
                    onclick="showProfile('${student.roll}')">
                    ${student.name}
                </button>
            </td>

            <td>${student.roll}</td>

            <td>${student.phone || "-"}</td>

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
    });
}


// ================= SEARCH STUDENT =================

async function searchStudent() {

    const search =
        document
            .getElementById("searchBox")
            .value
            .trim()
            .toLowerCase();

    try {

        const response =
            await fetch(API + "/students");

        const students =
            await response.json();

        const filtered =
            students.filter(student =>

                student.branch === currentBranch &&

                student.roll
                    .toLowerCase()
                    .includes(search)

            );

        renderStudents(filtered);

    } catch (error) {

        console.error(error);

        alert("Failed to search students");
    }
}


// ================= STUDENT PROFILE =================

async function showProfile(roll) {

    if (
        sessionStorage.getItem("isLoggedIn") !== "true" &&
        !studentLoggedIn
    ) {

        alert("Admin login required");

        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/students/" +
                encodeURIComponent(roll)
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

        currentStudent = student;

        hideSections();

        document
            .getElementById("profileSection")
            .classList.remove("hidden");

        document.getElementById("profileName").innerText =
            currentStudent.name;

        document.getElementById("profileRoll").innerText =
            "Roll: " +
            currentStudent.roll;

        document.getElementById("profilePhone").innerText =
            "Phone: " +
            (currentStudent.phone || "-");

        document.getElementById("profileBranch").innerText =
            "Branch: " +
            currentStudent.branch;

        document.getElementById("profilePhoto").src =
            currentStudent.photo ||
            "https://via.placeholder.com/120";

        /*
         * loadIssuedBooks() gets the current
         * issued count directly from MySQL.
         */
        await loadIssuedBooks();

    } catch (error) {

        console.error(error);

        alert("Failed to load student profile");
    }
}


// ================= LOAD ISSUED BOOKS =================

async function loadIssuedBooks() {

    const table =
        document.getElementById("issuedTable");

    table.innerHTML = "";

    if (!currentStudent) {
        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/students/" +
                encodeURIComponent(currentStudent.roll) +
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

        /*
         * Count ONLY currently issued books.
         * Returned books are not counted.
         */
        const issuedBooks =
            books.filter(
                book => book.status === "Issued"
            ).length;

        // ================= UPDATE LIMIT =================

        document.getElementById("bookLimit").textContent =
            "Books Issued: " +
            issuedBooks +
            " / " +
            BOOK_LIMIT;


        // ================= DISPLAY BOOKS =================

        books.forEach((book, index) => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${index + 1}</td>

                <td>${book.book_name}</td>

                <td>${book.author || "-"}</td>

                <td>${formatDate(book.issue_date)}</td>

                <td>${formatDate(book.due_date)}</td>

                <td>${book.status}</td>

                <td>${formatDate(book.return_date)}</td>

                <td>

                    ${
                        book.status === "Issued"

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

        });

        /*
         * If the student has already reached
         * the limit, disable Issue Book button.
         */
        updateIssueButton(issuedBooks);

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load issued books.\n" +
            "Make sure the backend is running."
        );
    }
}


// ================= UPDATE ISSUE BUTTON =================

function updateIssueButton(issuedBooks) {

    const buttons =
        document.querySelectorAll(
            '#profileSection > button[onclick="showIssueBook()"]'
        );

    buttons.forEach(button => {

        if (issuedBooks >= BOOK_LIMIT) {

            button.disabled = true;

            button.textContent =
                "Book Limit Reached (4 / 4)";

        } else {

            button.disabled = false;

            button.textContent =
                "Issue Book";
        }
    });
}


// ================= SHOW ISSUE BOOK =================

async function showIssueBook() {

    if (!currentStudent) {
        return;
    }

    /*
     * Get the latest history from MySQL
     * before allowing a new issue.
     */
    try {

        const response =
            await fetch(
                API +
                "/students/" +
                encodeURIComponent(currentStudent.roll) +
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
                book => book.status === "Issued"
            ).length;

        document.getElementById("bookLimit").textContent =
            "Books Issued: " +
            issuedBooks +
            " / " +
            BOOK_LIMIT;

        if (issuedBooks >= BOOK_LIMIT) {

            alert(
                "This student has reached the maximum book issue limit of 4."
            );

            updateIssueButton(issuedBooks);

            return;
        }

        document
            .getElementById("issueArea")
            .classList.remove("hidden");

        document.getElementById("issueDate").value =
            new Date()
                .toISOString()
                .split("T")[0];

        loadBookOptions();

    } catch (error) {

        console.error(error);

        alert("Unable to check book limit");
    }
}


// ================= LOAD BOOK OPTIONS =================

async function loadBookOptions() {

    const select =
        document.getElementById("bookSelect");

    select.innerHTML = "";

    try {

        const response =
            await fetch(API + "/books");

        const books =
            await response.json();

        books
            .filter(
                book => book.available_copies > 0
            )
            .forEach(book => {

                const option =
                    document.createElement("option");

                option.value =
                    book.serial;

                option.textContent =
                    book.name +
                    " - " +
                    book.author +
                    " (" +
                    book.available_copies +
                    " available)";

                select.appendChild(option);

            });

    } catch (error) {

        console.error(error);

        alert("Failed to load books");
    }
}


// ================= SEARCH BOOKS =================

async function searchBooks() {

    const search =
        document
            .getElementById("bookSearch")
            .value
            .toLowerCase();

    const select =
        document.getElementById("bookSelect");

    select.innerHTML = "";

    try {

        const response =
            await fetch(API + "/books");

        const books =
            await response.json();

        books
            .filter(book =>

                book.available_copies > 0 &&

                book.name
                    .toLowerCase()
                    .includes(search)

            )
            .forEach(book => {

                const option =
                    document.createElement("option");

                option.value =
                    book.serial;

                option.textContent =
                    book.name +
                    " - " +
                    book.author +
                    " (" +
                    book.available_copies +
                    " available)";

                select.appendChild(option);

            });

    } catch (error) {

        console.error(error);
    }
}


// ================= ISSUE BOOK =================

async function issueBook() {

    if (!currentStudent) {

        alert("Select a student first");

        return;
    }

    const serial =
        document.getElementById("bookSelect").value;

    const issueDate =
        document.getElementById("issueDate").value;

    const dueDate =
        document.getElementById("dueDate").value;

    if (!serial || !issueDate || !dueDate) {

        alert("Please select book and dates");

        return;
    }

    try {

        /*
         * Check current limit immediately before issuing.
         */
        const historyResponse =
            await fetch(
                API +
                "/students/" +
                encodeURIComponent(currentStudent.roll) +
                "/history"
            );

        const history =
            await historyResponse.json();

        if (!historyResponse.ok) {

            alert(
                history.error ||
                "Unable to check book limit"
            );

            return;
        }

        const issuedBooks =
            history.filter(
                book => book.status === "Issued"
            ).length;

        if (issuedBooks >= BOOK_LIMIT) {

            alert(
                "Book issue limit reached.\n" +
                "Maximum allowed: 4 books."
            );

            await showProfile(currentStudent.roll);

            return;
        }


        // ================= ISSUE API =================

        const response =
            await fetch(
                API + "/transactions/issue",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        roll:
                            currentStudent.roll,

                        serial:
                            serial,

                        issueDate:
                            issueDate,

                        dueDate:
                            dueDate

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

            /*
             * Refresh profile because the backend
             * may have rejected the transaction.
             */
            await showProfile(currentStudent.roll);

            return;
        }

        alert("Book issued successfully");

        document
            .getElementById("issueArea")
            .classList.add("hidden");

        /*
         * Refresh books and student profile.
         * This automatically changes 2/4 → 3/4 etc.
         */
        await loadBooks();

        await showProfile(currentStudent.roll);

    } catch (error) {

        console.error(error);

        alert(
            "Unable to issue book.\n" +
            "Make sure the backend is running."
        );
    }
}


// ================= RETURN BOOK =================

async function returnBook(transactionId) {

    if (!currentStudent) {
        return;
    }

    
    if (!confirm("Return this book?")) {
        return;
    }

    try {

        const response =
            await fetch(
                API + "/transactions/return",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        transactionId:
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

        alert("Book returned successfully");

        /*
         * Refresh everything.
         *
         * Example:
         * Before return: 4 / 4
         * After return : 3 / 4
         */
        await loadBooks();

        await showProfile(currentStudent.roll);

    } catch (error) {

        console.error(error);

        alert(
            "Unable to return book.\n" +
            "Make sure the backend is running."
        );
    }
}


// ================= UPDATE BOOK STATUS =================

function updateBookStatus() {

    loadIssuedBooks();
}


// ================= HANDLE RETURN BOOK =================

function handleReturnBook() {

    loadIssuedBooks();
}


// ================= UPDATE RETURN DATE =================

function updateReturnDate() {

    loadIssuedBooks();
}


// ================= DELETE STUDENT =================

async function deleteStudent(studentId) {

    if (!confirm("Delete this student?")) {
        return;
    }

    try {

        const response =
            await fetch(
                API +
                "/students/" +
                studentId,
                {
                    method: "DELETE"
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

        alert("Student Deleted Successfully");

        await loadStudents(currentBranch);

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete student.\n" +
            "Make sure the backend is running."
        );
    }
}


// =====================================================
// QR CODE FEATURE
// =====================================================

function generateStudentQR(roll) {

    if (!roll) {

        alert("Student roll number not found");

        return;
    }

    const profileURL =
        "https://pavani3337.github.io/CLMSG/student.html?roll=" +
        encodeURIComponent(roll);

    const qrWindow =
        window.open("", "_blank");

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

<title>Student QR - ${roll}</title>

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

<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

</head>

<body>

<div class="qr-box">

    <h2>Student Library QR</h2>

    <h3>${roll}</h3>

    <div id="qrcode"></div>

    <p>
        Scan this QR code to open the student library profile.
    </p>

    <button onclick="window.print()">
        Print QR
    </button>

</div>

<script>

new QRCode(
    document.getElementById("qrcode"),
    {
        text: ${JSON.stringify(profileURL)},
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


// ================= IMPORT STUDENTS =================

async function importStudents() {

    const url =
        "https://script.google.com/macros/s/AKfycbz9cte0vWjY8E5Jc2ird5J6pLtX1MI0fXkBsHYzEj6BBRkgE_ZPdM5OsZ4t5OflVG1M/exec";

    try {

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (!Array.isArray(data)) {

            alert("Invalid student data");

            return;
        }

        let importedCount = 0;
        let existingCount = 0;
        let deletedCount = 0;

        for (const row of data) {

            if (!row || row.length < 5) {
                continue;
            }

            const name =
                String(row[1] || "").trim();

            const roll =
                String(row[2] || "").trim();

            const phone =
                String(row[3] || "").trim();

            const branch =
                String(row[4] || "").trim();

            let photo =
                String(row[5] || "").trim();

            if (!name || !roll) {
                continue;
            }

            if (photo.includes("id=")) {

                const id =
                    photo
                        .split("id=")[1]
                        .split("&")[0];

                photo =
                    "https://drive.google.com/thumbnail?id=" +
                    id +
                    "&sz=w500";
            }

            // ================= CHECK DELETED =================

            const deletedResponse =
                await fetch(
                    API +
                    "/students/deleted/" +
                    encodeURIComponent(roll)
                );

            if (deletedResponse.ok) {

                deletedCount++;

                continue;
            }

            // ================= SEND TO MYSQL =================

            const mysqlResponse =
                await fetch(
                    API + "/students",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name: name,
                            roll: roll,
                            phone: phone,
                            branch: branch,
                            photo: photo || null

                        })
                    }
                );

            const mysqlData =
                await mysqlResponse.json();

            if (mysqlResponse.status === 409) {

                existingCount++;

                continue;
            }

            if (!mysqlResponse.ok) {

                console.error(
                    "MySQL error for",
                    roll,
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
            "Unable to import students.\n" +
            "Make sure the backend is running."
        );
    }
}


// ================= LOAD STUDENTS FROM MYSQL =================

async function loadStudentsFromDatabase() {

    try {

        const response =
            await fetch(API + "/students");

        if (!response.ok) {

            throw new Error(
                "Failed to fetch students"
            );
        }

        const students =
            await response.json();

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

        if (currentBranch) {

            loadStudents(currentBranch);
        }

    } catch (error) {

        console.error(error);

        alert(
            "Failed to load students from MySQL"
        );
    }
}


// ================= STUDENT OTP =================

function sendStudentOTP() {

    const roll =
        document
            .getElementById("studentLoginRoll")
            .value
            .trim();

    const phone =
        document
            .getElementById("studentLoginPhone")
            .value
            .trim();

    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];

    const student =
        students.find(s =>
            s.roll === roll &&
            s.phone === phone
        );

    if (!student) {

        alert("Student not found");

        return;
    }

    const otp =
        Math.floor(
            1000 +
            Math.random() * 9000
        ).toString();

    otpStore = {

        roll: roll,

        otp: otp
    };

    alert("Demo OTP: " + otp);
}


// ================= VERIFY OTP =================

function verifyStudentOTP() {

    const otp =
        document
            .getElementById("studentOTP")
            .value
            .trim();

    if (!otpStore) {

        alert(
            "Please request OTP first"
        );

        return;
    }

    if (otp !== otpStore.otp) {

        alert("Invalid OTP");

        return;
    }

    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];

    studentLoggedIn =
        students.find(s =>
            s.roll === otpStore.roll
        );

    if (!studentLoggedIn) {

        alert("Student not found");

        return;
    }

    otpStore = null;

    alert("Student login successful");
}


// ================= STUDENT REPORT =================

function downloadMyReport() {

    if (!studentLoggedIn) {

        alert("Please login first");

        return;
    }

    const history =
        JSON.parse(
            localStorage.getItem("bookHistory")
        ) || [];

    const myRecords =
        history.filter(h =>
            h.roll === studentLoggedIn.roll
        );

    let content =
        "Student Library Report\n\n";

    content +=
        "Name: " +
        studentLoggedIn.name +
        "\n";

    content +=
        "Roll: " +
        studentLoggedIn.roll +
        "\n";

    content +=
        "Branch: " +
        studentLoggedIn.branch +
        "\n\n";

    myRecords.forEach((record, index) => {

        content +=
            (index + 1) +
            ". " +
            record.bookName +
            " | " +
            record.issueDate +
            " | " +
            (record.returnDate || "-") +
            " | " +
            record.status +
            "\n";
    });

    const blob =
        new Blob(
            [content],
            { type: "text/plain" }
        );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        studentLoggedIn.roll +
        "_library_report.txt";

    link.click();

    URL.revokeObjectURL(link.href);
}


// =====================================================
// LIBRARY REPORTS
// =====================================================


// ================= SINGLE DATE REPORT =================

async function generateSingleReport() {

    const date =
        document
            .getElementById("singleReportDate")
            .value;

    if (!date) {

        alert("Please select a date");

        return;
    }

    await generateLibraryReport(
        date,
        date
    );
}


// ================= DATE RANGE REPORT =================

async function generateRangeReport() {

    const fromDate =
        document
            .getElementById("fromDate")
            .value;

    const toDate =
        document
            .getElementById("toDate")
            .value;

    if (!fromDate || !toDate) {

        alert(
            "Please select both dates"
        );

        return;
    }

    if (fromDate > toDate) {

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


// ================= GET CURRENT BORROWING COUNTS =================

async function getCurrentBorrowingCounts(logs) {

    const rolls =
        [
            ...new Set(
                logs
                    .map(log => log.roll)
                    .filter(Boolean)
            )
        ];

    const counts = {};

    await Promise.all(

        rolls.map(async roll => {

            try {

                const response =
                    await fetch(
                        API +
                        "/students/" +
                        encodeURIComponent(roll) +
                        "/history"
                    );

                const history =
                    await response.json();

                if (!response.ok) {
                    counts[roll] = 0;
                    return;
                }

                counts[roll] =
                    history.filter(
                        book =>
                            book.status === "Issued"
                    ).length;

            } catch (error) {

                console.error(
                    "Failed to get count for",
                    roll,
                    error
                );

                counts[roll] = 0;
            }
        })
    );

    return counts;
}


// ================= GENERATE LIBRARY REPORT =================

async function generateLibraryReport(from, to) {

    try {

        const response =
            await fetch(
                API +
                "/reports/library?from=" +
                encodeURIComponent(from) +
                "&to=" +
                encodeURIComponent(to)
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

        /*
         * Get the current borrowing count
         * of every student appearing in the report.
         */
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

            data.logs.forEach((log, index) => {

                const currentCount =
                    borrowingCounts[log.roll] || 0;

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
            });
        }

        document
            .getElementById("reportOutput")
            .textContent = output;

    } catch (error) {

        console.error(error);

        alert(
            "Unable to generate report.\n" +
            "Make sure the backend is running."
        );
    }
}


// =====================================================
// DOWNLOAD PDF REPORT
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

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF();

    const logs =
        currentReport.logs;

    const issued =
        logs.filter(
            log =>
                log.operation === "Issued"
        );

    const returned =
        logs.filter(
            log =>
                log.operation === "Returned"
        );

    const dates =
        [
            ...new Set(
                logs.map(
                    log => log.date
                )
            )
        ].sort();

    const borrowingCounts =
        currentReport.borrowingCounts ||
        {};

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

        // ================= HEADER =================

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
                align: "center"
            }
        );

        doc.setFontSize(14);

        doc.text(
            "Central Library",
            105,
            67,
            {
                align: "center"
            }
        );

        doc.setFontSize(16);

        doc.text(
            "Library Activity Report",
            105,
            77,
            {
                align: "center"
            }
        );

        // ================= GENERATED DATE =================

        doc.setFontSize(9);

        doc.text(
            "Generated On: " +
            new Date().toLocaleString(),
            105,
            87,
            {
                align: "center"
            }
        );


        // ================= SUMMARY =================

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

            theme: "grid",

            styles: {
                fontSize: 10,
                halign: "center"
            },

            headStyles: {
                halign: "center"
            }

        });


        let y =
            doc.lastAutoTable.finalY +
            15;


        // ================= LIMIT INFORMATION =================

        doc.setFontSize(10);

        doc.text(
            "Maximum Books Per Student: " +
            BOOK_LIMIT,
            14,
            y
        );

        y += 12;


        // ================= DATE-WISE REPORT =================

        dates.forEach(date => {

            const dateLogs =
                logs.filter(
                    log =>
                        log.date === date
                );

            const dateIssued =
                dateLogs.filter(
                    log =>
                        log.operation === "Issued"
                );

            const dateReturned =
                dateLogs.filter(
                    log =>
                        log.operation === "Returned"
                );


            if (y > 235) {

                doc.addPage();

                y = 20;
            }


            doc.setFontSize(12);

            doc.text(
                "Date : " + date,
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


            // ================= ISSUED BOOKS =================

            if (dateIssued.length > 0) {

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

                    theme: "grid",

                    styles: {
                        fontSize: 8
                    }

                });

                y =
                    doc.lastAutoTable.finalY +
                    12;
            }


            // ================= RETURNED BOOKS =================

            if (dateReturned.length > 0) {

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

                    theme: "grid",

                    styles: {
                        fontSize: 8
                    }

                });

                y =
                    doc.lastAutoTable.finalY +
                    12;
            }

        });


        // ================= LIBRARIAN SIGNATURE =================

        const pageHeight =
            doc.internal.pageSize.getHeight();

        const pageWidth =
            doc.internal.pageSize.getWidth();

        if (
            y >
            pageHeight - 50
        ) {

            doc.addPage();
        }

        const signatureY =
            doc.internal.pageSize.getHeight() -
            25;

        doc.setFontSize(10);

        doc.text(
            "Librarian Signature",
            pageWidth - 55,
            signatureY,
            {
                align: "center"
            }
        );

        doc.line(
            pageWidth - 80,
            signatureY - 5,
            pageWidth - 30,
            signatureY - 5
        );


        // ================= SAVE =================

        doc.save(
            "library_report_" +
            currentReport.from +
            "_to_" +
            currentReport.to +
            ".pdf"
        );
    }
}