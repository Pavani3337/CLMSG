```javascript
const API = "http://localhost:5000/api";

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

function registerStudent() {

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


    reader.onload = function (e) {

        let students =
            JSON.parse(localStorage.getItem("students")) || [];


        const existing =
            students.find(s => s.roll === roll);


        if (existing) {

            alert("Student already registered");

            return;

        }


        const student = {

            id: Date.now(),

            name: name,

            roll: roll,

            phone: phone,

            branch: branch,

            photo: e.target.result,

            issuedBooks: []

        };


        students.push(student);


        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );


        alert("Student registered successfully");


        document.getElementById("studentName").value = "";

        document.getElementById("studentRoll").value = "";

        document.getElementById("studentPhone").value = "";

        document.getElementById("studentPhoto").value = "";

    };


    reader.readAsDataURL(photoFile);

}


// ================= BOOKS =================

// Add book to MySQL

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

            alert(data.error);

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

// Load books from MySQL

async function loadBooks() {

    try {

        const response =
            await fetch(API + "/books");


        const books =
            await response.json();


        if (!response.ok) {

            alert(books.error || "Failed to load books");

            return;

        }


        renderBooks(books);


    } catch (error) {

        console.error(error);

        alert("Failed to load books");

    }

}


// ================= RENDER BOOKS =================

function renderBooks(books) {

    let html = "";


    books.forEach(book => {

        const issued =
            book.total_copies - book.available_copies;


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
                <button onclick="deleteBook('${book.serial}')">
                    Delete
                </button>
            </td>

        </tr>
        `;

    });


    document.getElementById("booksTable").innerHTML = html;

}


// ================= SEARCH BOOK =================

// Search books from MySQL

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

        alert("Failed to search books");

    }

}


// ================= BOOK HISTORY =================

function showBookHistory(serial) {

    hideSections();


    document
        .getElementById("bookHistorySection")
        .classList.remove("hidden");


    const history =
        JSON.parse(
            localStorage.getItem("bookHistory")
        ) || [];


    const records =
        history.filter(
            h => h.serial === serial
        );


    const table =
        document.getElementById("bookHistoryTable");


    table.innerHTML = "";


    records.forEach((record, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${index + 1}</td>

            <td>${record.studentName}</td>

            <td>${record.roll}</td>

            <td>${record.issueDate}</td>

            <td>${record.returnDate || "-"}</td>

            <td>${record.status}</td>

        `;


        table.appendChild(row);

    });

}


// ================= DELETE BOOK =================

// Delete book from MySQL

async function deleteBook(serial) {

    if (!confirm("Delete this book?")) {

        return;

    }


    try {

        const response =
            await fetch(
                API + "/books/" +
                encodeURIComponent(serial),
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.error);

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

function loadStudents(branch) {

    currentBranch = branch;


    hideSections();


    document
        .getElementById("studentsSection")
        .classList.remove("hidden");


    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    const filtered =
        students.filter(
            student =>
                student.branch === branch
        );


    renderStudents(filtered);

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
                <button onclick="showProfile(${student.id})">
                    ${student.name}
                </button>
            </td>

            <td>${student.roll}</td>

            <td>${student.phone}</td>

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

function searchStudent() {

    const search =
        document
            .getElementById("searchBox")
            .value
            .trim()
            .toLowerCase();


    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    const filtered =
        students.filter(student =>

            student.branch === currentBranch &&

            student.roll
                .toLowerCase()
                .includes(search)

        );


    renderStudents(filtered);

}


// ================= STUDENT PROFILE =================

function showProfile(studentId) {

    if (
        sessionStorage.getItem("isLoggedIn") !== "true" &&
        !studentLoggedIn
    ) {

        alert("Admin login required");

        return;

    }


    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    currentStudent =
        students.find(
            s => s.id === studentId
        );


    if (!currentStudent) {

        alert("Student not found");

        return;

    }


    hideSections();


    document
        .getElementById("profileSection")
        .classList.remove("hidden");


    document.getElementById("profileName").innerText =
        currentStudent.name;


    document.getElementById("profileRoll").innerText =
        "Roll: " + currentStudent.roll;


    document.getElementById("profilePhone").innerText =
        "Phone: " + currentStudent.phone;


    document.getElementById("profileBranch").innerText =
        "Branch: " + currentStudent.branch;


    document.getElementById("profilePhoto").src =
        currentStudent.photo ||
        "https://via.placeholder.com/120";


    loadIssuedBooks();

}


// ================= LOAD ISSUED BOOKS =================

function loadIssuedBooks() {

    const table =
        document.getElementById("issuedTable");


    table.innerHTML = "";


    if (!currentStudent) {

        return;

    }


    currentStudent.issuedBooks =
        currentStudent.issuedBooks || [];


    currentStudent.issuedBooks.forEach(
        (book, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>${index + 1}</td>

                <td>${book.bookName}</td>

                <td>${book.author}</td>

                <td>${book.issueDate}</td>

                <td>${book.dueDate}</td>

                <td>${book.status}</td>

                <td>${book.returnDate || "-"}</td>

                <td>

                    ${
                        book.status === "Issued"

                        ?

                        `<button onclick="returnBook(${index})">
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

}


// ================= SHOW ISSUE BOOK =================

function showIssueBook() {

    document
        .getElementById("issueArea")
        .classList.remove("hidden");


    document.getElementById("issueDate").value =
        new Date()
            .toISOString()
            .split("T")[0];


    loadBookOptions();

}


// ================= LOAD BOOK OPTIONS =================

function loadBookOptions() {

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];


    const select =
        document.getElementById("bookSelect");


    select.innerHTML = "";


    books
        .filter(
            book =>
                book.availableCopies > 0
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
                book.availableCopies +
                " available)";


            select.appendChild(option);

        });

}


// ================= SEARCH BOOKS =================

function searchBooks() {

    const search =
        document
            .getElementById("bookSearch")
            .value
            .toLowerCase();


    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];


    const select =
        document.getElementById("bookSelect");


    select.innerHTML = "";


    books
        .filter(book =>

            book.availableCopies > 0 &&

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
                book.availableCopies +
                " available)";


            select.appendChild(option);

        });

}


// ================= ISSUE BOOK =================

function issueBook() {

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


    let books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];


    const selectedBook =
        books.find(
            book =>
                book.serial === serial
        );


    if (!selectedBook) {

        alert("Book not found");

        return;

    }


    if (selectedBook.availableCopies <= 0) {

        alert("Book not available");

        return;

    }


    selectedBook.availableCopies--;


    currentStudent.issuedBooks =
        currentStudent.issuedBooks || [];


    currentStudent.issuedBooks.push({

        serial:
            selectedBook.serial,

        bookName:
            selectedBook.name,

        author:
            selectedBook.author,

        issueDate:
            issueDate,

        dueDate:
            dueDate,

        returnDate:
            "",

        status:
            "Issued"

    });


    let logs =
        JSON.parse(
            localStorage.getItem("libraryLogs")
        ) || [];


    logs.push({

        roll:
            currentStudent.roll,

        studentName:
            currentStudent.name,

        serial:
            selectedBook.serial,

        bookName:
            selectedBook.name,

        date:
            issueDate,

        type:
            "Issued"

    });


    let history =
        JSON.parse(
            localStorage.getItem("bookHistory")
        ) || [];


    history.push({

        roll:
            currentStudent.roll,

        studentName:
            currentStudent.name,

        serial:
            selectedBook.serial,

        bookName:
            selectedBook.name,

        issueDate:
            issueDate,

        returnDate:
            "",

        status:
            "Issued"

    });


    localStorage.setItem(
        "students",
        JSON.stringify(
            JSON.parse(
                localStorage.getItem("students")
            ).map(s =>
                s.id === currentStudent.id
                    ? currentStudent
                    : s
            )
        )
    );


    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );


    localStorage.setItem(
        "libraryLogs",
        JSON.stringify(logs)
    );


    localStorage.setItem(
        "bookHistory",
        JSON.stringify(history)
    );


    alert("Book issued successfully");


    document
        .getElementById("issueArea")
        .classList.add("hidden");


    loadIssuedBooks();

}


// ================= RETURN BOOK =================

function returnBook(bookIndex) {

    if (!currentStudent) {

        return;

    }


    const book =
        currentStudent.issuedBooks[bookIndex];


    if (!book || book.status !== "Issued") {

        return;

    }


    const returnDate =
        new Date()
            .toISOString()
            .split("T")[0];


    let books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];


    const selectedBook =
        books.find(
            b => b.serial === book.serial
        );


    if (selectedBook) {

        selectedBook.availableCopies++;

    }


    book.status = "Returned";

    book.returnDate = returnDate;


    let history =
        JSON.parse(
            localStorage.getItem("bookHistory")
        ) || [];


    const historyRecord =
        history.find(h =>

            h.serial === book.serial &&

            h.roll === currentStudent.roll &&

            h.status === "Issued"

        );


    if (historyRecord) {

        historyRecord.status = "Returned";

        historyRecord.returnDate = returnDate;

    }


    let logs =
        JSON.parse(
            localStorage.getItem("libraryLogs")
        ) || [];


    logs.push({

        roll:
            currentStudent.roll,

        studentName:
            currentStudent.name,

        serial:
            book.serial,

        bookName:
            book.bookName,

        date:
            returnDate,

        type:
            "Returned"

    });


    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );


    localStorage.setItem(
        "students",
        JSON.stringify(
            JSON.parse(
                localStorage.getItem("students")
            ).map(s =>
                s.id === currentStudent.id
                    ? currentStudent
                    : s
            )
        )
    );


    localStorage.setItem(
        "bookHistory",
        JSON.stringify(history)
    );


    localStorage.setItem(
        "libraryLogs",
        JSON.stringify(logs)
    );


    alert("Book returned successfully");


    loadIssuedBooks();

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

function deleteStudent(studentId) {

    if (!confirm("Delete this student?")) {

        return;

    }


    let students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    const student =
        students.find(
            s => s.id === studentId
        );


    if (!student) {

        return;

    }


    let deletedStudents =
        JSON.parse(
            localStorage.getItem("deletedStudents")
        ) || [];


    deletedStudents.push(student);


    students =
        students.filter(
            s => s.id !== studentId
        );


    localStorage.setItem(
        "deletedStudents",
        JSON.stringify(deletedStudents)
    );


    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );


    loadStudents(currentBranch);

}


// =====================================================
//                    QR CODE FEATURE
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

        alert("Please allow pop-ups for this website.");

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

new QRCode(document.getElementById("qrcode"), {

    text: ${JSON.stringify(profileURL)},

    width: 256,

    height: 256

});

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


        let students =
            JSON.parse(
                localStorage.getItem("students")
            ) || [];


        let importedCount = 0;


        data.forEach(row => {

            if (!row || row.length < 5) {

                return;

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

                return;

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


            const existing =
                students.find(
                    s => s.roll === roll
                );


            if (existing) {

                existing.name =
                    name;

                existing.phone =
                    phone;

                existing.branch =
                    branch;

                existing.photo =
                    photo || existing.photo;

                existing.issuedBooks =
                    existing.issuedBooks || [];

            } else {

                students.push({

                    id:
                        Date.now() +
                        Math.random(),

                    name:
                        name,

                    roll:
                        roll,

                    phone:
                        phone,

                    branch:
                        branch,

                    photo:
                        photo,

                    issuedBooks:
                        []

                });

            }


            importedCount++;

        });


        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );


        alert(
            importedCount +
            " students imported/updated successfully."
        );


        if (currentBranch) {

            loadStudents(currentBranch);

        }


    } catch (error) {

        console.error(error);

        alert(
            "Unable to import students. Please check the connection."
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

        roll:
            roll,

        otp:
            otp

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

        alert("Please request OTP first");

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
        students.find(
            s => s.roll === otpStore.roll
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
        history.filter(
            h =>
                h.roll ===
                studentLoggedIn.roll
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


    myRecords.forEach(
        (record, index) => {

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

        }
    );


    const blob =
        new Blob(
            [content],
            {
                type: "text/plain"
            }
        );


    const link =
        document.createElement("a");


    link.href =
        URL.createObjectURL(blob);


    link.download =
        studentLoggedIn.roll +
        "_library_report.txt";


    link.click();

}
```
