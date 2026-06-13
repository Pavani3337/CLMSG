const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "1234";

let currentBranch = "";
let currentStudent = null;

function initStorage() {
    if (!localStorage.getItem("students")) {
        localStorage.setItem("students", JSON.stringify([]));
    }

    if (!localStorage.getItem("books")) {
        localStorage.setItem("books", JSON.stringify([]));
    }
}


async function syncGoogleFormStudents() {

    const url = "https://script.google.com/macros/s/AKfycbz9cte0vWjY8E5Jc2ird5J6pLtX1MI0fXkBsHYzEj6BBRkgE_ZPdM5OsZ4t5OflVG1M/exec";

    try {

        const response = await fetch(url);

        const data = await response.json();

        let students = [];

        for (let i = 1; i < data.length; i++) {

            students.push({

                id: i,

                name: data[i][1],

                roll: data[i][2].toString(),

                phone: data[i][3].toString(),

                branch:
    data[i][4] === "ME"
        ? "MECH"
        : data[i][4],,

                photo: data[i][5],

                issuedBooks: []

            });

        }

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

        console.log("Google Form Students Synced");

    }
    catch(error) {

        console.error(error);

    }

}


window.onload = function () {

    initStorage();

    syncGoogleFormStudents();

    const isLoggedIn =
        sessionStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {

        document
            .getElementById("loginPage")
            .classList.add("hidden");

        document
            .getElementById("dashboardPage")
            .classList.remove("hidden");
    }
};



function login() {

    const id =
        document.getElementById("adminId").value;

    const password =
        document.getElementById("adminPassword").value;

    if (
    id === ADMIN_ID &&
    password === ADMIN_PASSWORD
) {

    sessionStorage.setItem(
        "isLoggedIn",
        "true"
    );


        document
            .getElementById("loginPage")
            .classList.add("hidden");

        document
            .getElementById("dashboardPage")
            .classList.remove("hidden");

    }
    else {

        alert("Invalid Login");

    }
}


function logout() {

    sessionStorage.removeItem(
        "isLoggedIn"
    );

    location.reload();

}


function hideSections() {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.add("hidden");

        });

}

function showSection(id) {

    hideSections();

    document
        .getElementById(id)
        .classList.remove("hidden");

    if (id === "booksSection") {
        loadBooks();
    }

}

function registerStudent() {

    const name =
        document.getElementById("studentName").value;

    const roll =
        document.getElementById("studentRoll").value;

    const phone =
        document.getElementById("studentPhone").value;

    const branch =
        document.getElementById("studentBranch").value;

    const file =
        document.getElementById("studentPhoto").files[0];

    if (!name || !roll || !phone || !file) {

        alert("Fill all fields");
        return;

    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const students =
            JSON.parse(
                localStorage.getItem("students")
            );

        students.push({

            id: Date.now(),

            name: name,

            roll: roll,

	    phone: phone,

            branch: branch,

            photo: e.target.result,

            issuedBooks: []

        });

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

        alert("Student Registered");

        document.getElementById("studentName").value = "";
        document.getElementById("studentRoll").value = "";
	document.getElementById("studentPhone").value = "";
        document.getElementById("studentPhoto").value = "";

    };

    reader.readAsDataURL(file);

}



function addBook() {

    const serial =
        document.getElementById("bookSerial").value.trim();

    const name =
        document.getElementById("bookName").value.trim();

    const author =
        document.getElementById("bookAuthor").value.trim();

    if (!serial || !name || !author) {
        alert("Fill all fields properly");
        return;
    }

    const books =
        JSON.parse(localStorage.getItem("books")) || [];

    books.push({
        serial: serial,
        name: name,
        author: author
    });

    localStorage.setItem("books", JSON.stringify(books));

    loadBooks();

    document.getElementById("bookSerial").value = "";
    document.getElementById("bookName").value = "";
    document.getElementById("bookAuthor").value = "";
}


function loadBooks() {

    const books =
        JSON.parse(localStorage.getItem("books")) || [];

    let html = "";

    books.forEach(book => {

        html += `
        <tr>
            <td>${book.serial || "-"}</td>
            <td>${book.name || "-"}</td>
            <td>${book.author || "-"}</td>

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



// =========================
// PART 2
// STUDENTS + BRANCHES
// =========================

function loadStudents(branch) {

    currentBranch = branch;

    hideSections();

    document
        .getElementById("studentsSection")
        .classList.remove("hidden");

    const students =
        JSON.parse(
            localStorage.getItem("students")
        );

    const filteredStudents =
        students.filter(
            student =>
                student.branch === branch
        );

    renderStudents(filteredStudents);

}

function renderStudents(students) {

    let html = "";

    students.forEach((student, index) => {

        html += `
        <tr>

            <td onclick="showProfile(${student.id})">
                ${index + 1}
            </td>

            <td onclick="showProfile(${student.id})">
                ${student.name}
            </td>

            <td onclick="showProfile(${student.id})">
                ${student.roll}
            </td>

	    <td onclick="showProfile(${student.id})">
    	        ${student.phone || "-"}
            </td>

            <td>
                <button onclick="deleteStudent(${student.id})">
                    Delete
                </button>
            </td>

        </tr>
        `;

    });

    document
        .getElementById("studentsTable")
        .innerHTML = html;

}




function searchStudent() {

    const value =
        document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const students =
        JSON.parse(
            localStorage.getItem("students")
        );

    const filtered =
        students.filter(student => {

            return (
                student.branch === currentBranch &&
                student.roll
                    .toLowerCase()
                    .includes(value)
            );

        });

    renderStudents(filtered);

}

function showProfile(studentId) {

    hideSections();

    document
        .getElementById("profileSection")
        .classList.remove("hidden");

    const students =
        JSON.parse(
            localStorage.getItem("students")
        );

    currentStudent =
        students.find(
            student =>
                student.id == studentId
        );

    document
        .getElementById("profileName")
        .innerText =
        currentStudent.name;

    document
        .getElementById("profileRoll")
        .innerText =
        "Roll Number : " +
        currentStudent.roll;

    document
        .getElementById("profilePhone")
        .innerText =
        "Phone Number : " +
        (currentStudent.phone || "-");

    document
        .getElementById("profileBranch")
        .innerText =
        "Branch : " +
        currentStudent.branch;

    document
        .getElementById("profilePhoto")
        .src =
        currentStudent.photo ||
        "https://via.placeholder.com/120";

    loadIssuedBooks();

}


// =========================
// PART 3
// ISSUE BOOKS
// =========================

function loadIssuedBooks() {

    let html = "";

    if (!currentStudent.issuedBooks) {
        currentStudent.issuedBooks = [];
    }

    currentStudent.issuedBooks.forEach((book, index) => {

        html += `
        <tr>
            <td>${index + 1}</td>
            <td>${book.bookName}</td>
            <td>${book.author}</td>
            <td>${book.issueDate}</td>
            <td>${book.dueDate}</td>
        </tr>
        `;

    });

    document
        .getElementById("issuedTable")
        .innerHTML = html;

}

function showIssueBook() {

    document
        .getElementById("issueArea")
        .classList.remove("hidden");

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];

    let options =
        `<option value="">Select Book</option>`;

    books.forEach(book => {

        options += `
        <option value="${book.serial}">
            ${book.name} - ${book.author}
        </option>
        `;

    });

    document
        .getElementById("bookSelect")
        .innerHTML = options;

    document
        .getElementById("bookSearch")
        .value = "";
}

function searchBooks() {

    const searchText =
        document
        .getElementById("bookSearch")
        .value
        .toLowerCase();

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];

    let options =
        `<option value="">Select Book</option>`;

    books.forEach(book => {

        if (
            book.name &&
            book.name.toLowerCase().includes(searchText)
        ) {

            options += `
            <option value="${book.serial}">
                ${book.name} - ${book.author}
            </option>
            `;
        }
    });

    document
        .getElementById("bookSelect")
        .innerHTML = options;
}



function issueBook() {

    const selectedSerial =
        document
        .getElementById("bookSelect")
        .value;

    const issueDate =
        document
        .getElementById("issueDate")
        .value;

    const dueDate =
        document
        .getElementById("dueDate")
        .value;

    if (
        !selectedSerial ||
        !issueDate ||
        !dueDate
    ) {

        alert(
            "Please fill all fields"
        );

        return;

    }

    const books =
        JSON.parse(
            localStorage.getItem("books")
        );

    const selectedBook =
        books.find(
            book =>
                book.serial === selectedSerial
        );

    if (!selectedBook) {

        alert("Book not found");

        return;

    }

    const students =
        JSON.parse(
            localStorage.getItem("students")
        );

    const studentIndex =
        students.findIndex(
            student =>
                student.id === currentStudent.id
        );

    if (studentIndex === -1) {

        alert("Student not found");

        return;

    }

    students[
        studentIndex
    ].issuedBooks.push({

        bookName:
            selectedBook.name,

        author:
            selectedBook.author,

        issueDate:
            issueDate,

        dueDate:
            dueDate

    });

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    currentStudent =
        students[studentIndex];

    loadIssuedBooks();

    document
        .getElementById("issueArea")
        .classList.add("hidden");

    document
        .getElementById("issueDate")
        .value = "";

    document
        .getElementById("dueDate")
        .value = "";

    alert("Book Issued Successfully");

}


function deleteStudent(studentId) {

    if (!confirm("Delete this student?")) {
        return;
    }

    let students =
        JSON.parse(
            localStorage.getItem("students")
        );

    students =
        students.filter(
            student =>
                student.id !== studentId
        );

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    loadStudents(currentBranch);

}

function deleteBook(serial) {

    if (!confirm("Delete this book?")) {
        return;
    }

    let books =
        JSON.parse(
            localStorage.getItem("books")
        );

    books =
        books.filter(
            book =>
                book.serial !== serial
        );

    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );

    loadBooks();

}