let studentLoggedIn = null;
let otpStore = null;
const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "1234";

let currentBranch = "";
let currentStudent = null;
let currentReport = "";

function initStorage() {
    if (!localStorage.getItem("students")) {
        localStorage.setItem("students", JSON.stringify([]));
    }

    if (!localStorage.getItem("books")) {
        localStorage.setItem("books", JSON.stringify([]));
    }

    if (!localStorage.getItem("deletedStudents")) {
    localStorage.setItem(
        "deletedStudents",
        JSON.stringify([])
    );
    }

if (!localStorage.getItem("libraryLogs")) {
    localStorage.setItem(
        "libraryLogs",
        JSON.stringify([])
    );
}

if (!localStorage.getItem("bookHistory")) {
    localStorage.setItem(
        "bookHistory",
        JSON.stringify([])
    );
}
}




window.onload = function () {

    initStorage();

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

    const totalCopies =
        parseInt(
            document.getElementById("bookCopies").value
        );

    if (
        !serial ||
        !name ||
        !author ||
        !totalCopies
    ) {

        alert("Fill all fields properly");
        return;

    }

    const books =
        JSON.parse(localStorage.getItem("books")) || [];

    books.push({

        serial: serial,

        name: name,

        author: author,

        totalCopies: totalCopies,

        availableCopies: totalCopies

    });

    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );

    loadBooks();

    document.getElementById("bookSerial").value = "";
    document.getElementById("bookName").value = "";
    document.getElementById("bookAuthor").value = "";
    document.getElementById("bookCopies").value = "";

}


function loadBooks() {

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];

    renderBooks(books);

}




function renderBooks(books) {

    let html = "";

    books.forEach(book => {

        const issued =
            (book.totalCopies || 0) -
            (book.availableCopies || 0);

        html += `
        <tr>
            <td>${book.serial || "-"}</td>
<td
onclick="showBookHistory('${book.serial}')"
style="cursor:pointer;color:blue;">

${book.name || "-"}

</td>
            <td>${book.author || "-"}</td>
            <td>${book.totalCopies || 0}</td>
            <td>${issued}</td>
            <td>${book.availableCopies || 0}</td>

            <td>
                <button onclick="deleteBook('${book.serial}')">
                    Delete
                </button>
            </td>
        </tr>
        `;

    });

    document
        .getElementById("booksTable")
        .innerHTML = html;
}


function searchBook() {

    const searchText =
        document
            .getElementById("bookSearchBox")
            .value
            .toLowerCase();

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];

    const filteredBooks =
        books.filter(book =>
            book.name
                .toLowerCase()
                .includes(searchText)
        );

    renderBooks(filteredBooks);
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

if (!sessionStorage.getItem("isLoggedIn") && !studentLoggedIn) {
    alert("Access Denied");
    return;
}

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

    <td>${book.status}</td>

    <td>${book.returnDate || "-"}</td>

    <td>
        ${
            book.status === "Issued"
            ?
            `<button onclick="returnBook(${index})">
                Return Book
            </button>`
            :
            `Returned`
        }
    </td>

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



    if (selectedBook.availableCopies <= 0) {

    alert("No copies available");

    return;

}

selectedBook.availableCopies--;
console.log(selectedBook);

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

   students[studentIndex].issuedBooks.push({
    serial: selectedBook.serial,   // ⭐ ADD THIS LINE
    bookName: selectedBook.name,
    author: selectedBook.author,
    issueDate: issueDate,
    dueDate: dueDate,
    returnDate: "",
    status: "Issued"
});



let logs =
    JSON.parse(
        localStorage.getItem("libraryLogs")
    ) || [];

logs.push({

    date: issueDate,

    action: "Issued",

    studentName:
        students[studentIndex].name,

    roll:
        students[studentIndex].roll,

    bookName:
        selectedBook.name

});


let history =
    JSON.parse(
        localStorage.getItem("bookHistory")
    ) || [];

history.push({

    serial: selectedBook.serial,

    bookName: selectedBook.name,

    studentName:
        students[studentIndex].name,

    roll:
        students[studentIndex].roll,

    issueDate: issueDate,

    returnDate: "",

    status: "Issued"

});

localStorage.setItem(
    "bookHistory",
    JSON.stringify(history)
);



localStorage.setItem(
    "libraryLogs",
    JSON.stringify(logs)
);


    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    localStorage.setItem(
    "books",
    JSON.stringify(books)
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

    let deletedStudents =
        JSON.parse(
            localStorage.getItem("deletedStudents")
        ) || [];

    const studentToDelete =
        students.find(
            student =>
                student.id === studentId
        );

    if (studentToDelete) {

        deletedStudents.push(
            studentToDelete
        );

        localStorage.setItem(
            "deletedStudents",
            JSON.stringify(deletedStudents)
        );
    }

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






async function importStudents() {

    const url = "https://script.google.com/macros/s/AKfycbz9cte0vWjY8E5Jc2ird5J6pLtX1MI0fXkBsHYzEj6BBRkgE_ZPdM5OsZ4t5OflVG1M/exec";

    try {

        const response = await fetch(url);

        const data = await response.json();

        let students =
            JSON.parse(
                localStorage.getItem("students")
            ) || [];

        for (let i = 1; i < data.length; i++) {

            const roll =
                data[i][2].toString();

            let photoUrl =
                data[i][5];

            if (
                photoUrl &&
                photoUrl.includes("id=")
            ) {

                const fileId =
                    photoUrl.split("id=")[1];

                photoUrl =
                    "https://drive.google.com/thumbnail?id=" +
                    fileId;
            }

            const existingStudent =
                students.find(
                    student =>
                        student.roll === roll
                );

	    let deletedStudents =
    JSON.parse(
        localStorage.getItem("deletedStudents")
    ) || [];

const deletedStudent =
    deletedStudents.find(
        student =>
            student.roll === roll
    );


            if (existingStudent) {

                existingStudent.name =
                    data[i][1];

                existingStudent.phone =
                    data[i][3].toString();

                existingStudent.branch =
                    data[i][4], 
                existingStudent.photo =
                    photoUrl;

                // issuedBooks remains untouched

            } 


		else if (deletedStudent) {

    students.push(deletedStudent);

    deletedStudents =
        deletedStudents.filter(
            student =>
                student.roll !== roll
        );

    localStorage.setItem(
        "deletedStudents",
        JSON.stringify(deletedStudents)
    );

}


		else {

                students.push({

                    id: Date.now() + i,

                    name: data[i][1],

                    roll: roll,

                    phone: data[i][3].toString(),

                    branch: data[i][4],
                    photo: photoUrl,

                    issuedBooks: []

                });

            }

        }

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

        alert(
            "Students imported successfully"
        );

    }
    catch(error) {

        console.error(error);

        alert(
            "Import failed"
        );

    }

}






function updateBookStatus(bookIndex, status) {
    const students = JSON.parse(localStorage.getItem("students"));
    const books = JSON.parse(localStorage.getItem("books"));

    const studentIndex = students.findIndex(
        student => student.id === currentStudent.id
    );

    if (studentIndex === -1) return;

    const book = students[studentIndex].issuedBooks[bookIndex];

console.log("New Status:", status);
console.log("Current Book Status:", book.status);
console.log(book);

    // 🔥 IF RETURNED → restore book count
    if (status === "Returned" && book.status !== "Returned") {
        const bookIndexInLibrary = books.findIndex(
    b => b.serial === book.serial
);

        if (bookIndexInLibrary !== -1) {
            books[bookIndexInLibrary].availableCopies += 1;

let logs =
    JSON.parse(
        localStorage.getItem("libraryLogs")
    ) || [];

logs.push({

    date:
        new Date()
        .toISOString()
        .split("T")[0],

    action: "Returned",

    studentName:
        students[studentIndex].name,

    roll:
        students[studentIndex].roll,

    bookName:
        book.bookName

});

localStorage.setItem(
    "libraryLogs",
    JSON.stringify(logs)
);
        }
    }

    // update status
    students[studentIndex].issuedBooks[bookIndex].status = status;

    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("books", JSON.stringify(books));

    currentStudent = students[studentIndex];

    loadIssuedBooks();
    loadBooks();
}






function updateReturnDate(bookIndex, returnDate) {

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
        return;
    }

    students[studentIndex]
        .issuedBooks[bookIndex]
        .returnDate = returnDate;

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    currentStudent =
        students[studentIndex];

}





function handleReturnBook(studentId, bookName) {
    let books = JSON.parse(localStorage.getItem("books")) || [];
    let students = JSON.parse(localStorage.getItem("students")) || [];

    const studentIndex = students.findIndex(s => s.id == studentId);

    if (studentIndex === -1) return;

    const bookIndex = books.findIndex(b => b.name === bookName);

    if (bookIndex !== -1) {
        books[bookIndex].availableCopies += 1;
    }

    localStorage.setItem("books", JSON.stringify(books));
    localStorage.setItem("students", JSON.stringify(students));

    loadIssuedBooks();
    loadBooks();
}




function generateSingleReport() {

    const selectedDate =
        document.getElementById(
            "singleReportDate"
        ).value;

    generateReport(selectedDate,selectedDate);
}




function generateRangeReport() {

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;

    const toDate =
        document.getElementById(
            "toDate"
        ).value;

    generateReport(
        fromDate,
        toDate
    );
}




function generateReport(fromDate, toDate) {

    let logs =
        JSON.parse(
            localStorage.getItem("libraryLogs")
        ) || [];

    let report = "";

    for (
        let currentDate = new Date(fromDate);
        currentDate <= new Date(toDate);
        currentDate.setDate(
            currentDate.getDate() + 1
        )
    ) {

        const dateString =
            currentDate
            .toISOString()
            .split("T")[0];

        const dayLogs =
            logs.filter(
                log => log.date === dateString
            );

        const issued =
            dayLogs.filter(
                log => log.action === "Issued"
            );

        const returned =
            dayLogs.filter(
                log => log.action === "Returned"
            );

        report +=
`====================================
Date : ${dateString}

Books Issued : ${issued.length}
Books Returned : ${returned.length}

Issued Books
`;

        issued.forEach(log => {

            report +=
`- ${log.bookName} | ${log.studentName} | ${log.roll}
`;

        });

        report += `
Returned Books
`;

        returned.forEach(log => {

            report +=
`- ${log.bookName} | ${log.studentName} | ${log.roll}
`;

        });

        report += "\n\n";
    }

    currentReport = report;

    document.getElementById(
        "reportOutput"
    ).textContent = report;
}



async function downloadReport() {

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const img = new Image();

    img.onload = function () {

        pdf.addImage(
            img,
            "PNG",
            85,
            5,
            40,
            30
        );

    let y = 45;
const collegeName = "UCEN JNTUK";
const libraryName = "Central Library";

    const logs =
        JSON.parse(localStorage.getItem("libraryLogs")) || [];

    const issuedLogs = logs.filter(log => log.action === "Issued");
    const returnedLogs = logs.filter(log => log.action === "Returned");

    const singleDate =
        document.getElementById("singleReportDate").value;

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    let startDate = "";
    let endDate = "";
    let fileName = "";

    if (singleDate) {
        startDate = singleDate;
        endDate = singleDate;
        fileName = `Library_Report_${singleDate}.pdf`;
    } else {
        startDate = fromDate;
        endDate = toDate;
        fileName = `Library_Report_${fromDate}_to_${toDate}.pdf`;
    }

    if (!startDate || !endDate) {
        alert("Please select date(s)");
        return;
    }


const generatedOn =
    new Date().toLocaleString();

pdf.setFontSize(18);

pdf.text(
    collegeName,
    105,
    y,
    { align: "center" }
);

y += 10;

pdf.setFontSize(14);

pdf.text(
    libraryName,
    105,
    y,
    { align: "center" }
);

y += 10;

pdf.setFontSize(16);

pdf.text(
    "Library Activity Report",
    105,
    y,
    { align: "center" }
);

y += 10;

pdf.setFontSize(10);

pdf.text(
    "Generated On : " +
    generatedOn,
    14,
    y
);

y += 15;



const issuedCount = issuedLogs.length;
const returnedCount = returnedLogs.length;
const totalTransactions = issuedCount + returnedCount;


pdf.autoTable({

    startY: y,

    head: [[
        "Books Issued",
        "Books Returned",
        "Total Transactions"
    ]],

    body: [[
        issuedCount,
        returnedCount,
        totalTransactions
    ]]

});

y =
    pdf.lastAutoTable.finalY +
    10;



    for (
        let currentDate = new Date(startDate);
        currentDate <= new Date(endDate);
        currentDate.setDate(
            currentDate.getDate() + 1
        )
    ) {

        const dateString =
            currentDate
            .toISOString()
            .split("T")[0];

        const dayLogs =
            logs.filter(
                log =>
                    log.date === dateString
            );

        const issued =
            dayLogs.filter(
                log =>
                    log.action === "Issued"
            );

        const returned =
            dayLogs.filter(
                log =>
                    log.action === "Returned"
            );

        if (
            issued.length === 0 &&
            returned.length === 0
        ) {
            continue;
        }

        if (y > 220) {

            pdf.addPage();

            y = 20;
        }

        pdf.setFontSize(13);

        pdf.text(
            `Date : ${dateString}`,
            14,
            y
        );

        y += 8;

        pdf.text(
            `Books Issued : ${issued.length}`,
            14,
            y
        );

        y += 7;

        pdf.text(
            `Books Returned : ${returned.length}`,
            14,
            y
        );

        y += 10;

        pdf.autoTable({

            startY: y,

            head: [[
                "Issued Book",
                "Student Name",
                "Roll Number"
            ]],

            body: issued.map(
                log => [

                    log.bookName,

                    log.studentName,

                    log.roll
                ]
            )

        });

        y =
            pdf.lastAutoTable.finalY + 10;

        pdf.autoTable({

            startY: y,

            head: [[
                "Returned Book",
                "Student Name",
                "Roll Number"
            ]],

            body: returned.map(
                log => [

                    log.bookName,

                    log.studentName,

                    log.roll
                ]
            )

        });

        y =
            pdf.lastAutoTable.finalY + 15;
    }


const pageHeight =
    pdf.internal.pageSize.height;

pdf.text(
    "____________________",
    140,
    pageHeight - 25
);

pdf.text(
    "Librarian Signature",
    145,
    pageHeight - 18
);


const totalPages = pdf.internal.getNumberOfPages();

for (let i = 1; i <= totalPages; i++) {

    pdf.setPage(i);

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    pdf.setFontSize(10);

    pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
    );
}


   
pdf.save(fileName);
};
img.src = "logo.png";
}



function returnBook(bookIndex) {

    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];

    const books =
        JSON.parse(
            localStorage.getItem("books")
        ) || [];

    const studentIndex =
        students.findIndex(
            student =>
                student.id === currentStudent.id
        );

    if (studentIndex === -1) {
        return;
    }

    const issuedBook =
        students[studentIndex]
        .issuedBooks[bookIndex];

    if (issuedBook.status === "Returned") {
        return;
    }

    // Restore available copies

    const libraryBook =
        books.find(
            book =>
                book.serial === issuedBook.serial
        );

    if (libraryBook) {
        libraryBook.availableCopies++;
    }

    // Set return details

    const now = new Date();

const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");
    issuedBook.status =
        "Returned";

    issuedBook.returnDate =
        today;


let history =
    JSON.parse(
        localStorage.getItem("bookHistory")
    ) || [];

const record =
    history.find(h =>

        h.serial === issuedBook.serial &&

        h.roll ===
        students[studentIndex].roll &&

        h.status === "Issued"

    );

if (record) {

    record.status =
        "Returned";

    record.returnDate =
        today;

}

localStorage.setItem(
    "bookHistory",
    JSON.stringify(history)
);



    // Save return log

    let logs =
        JSON.parse(
            localStorage.getItem("libraryLogs")
        ) || [];

    logs.push({

        date: today,

        action: "Returned",

        studentName:
            students[studentIndex].name,

        roll:
            students[studentIndex].roll,

        bookName:
            issuedBook.bookName

    });

    localStorage.setItem(
        "libraryLogs",
        JSON.stringify(logs)
    );

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );

    currentStudent =
        students[studentIndex];

    loadIssuedBooks();
    loadBooks();

    alert(
        "Book Returned Successfully"
    );
}







function showBookHistory(serial) {

    const history =
        JSON.parse(
            localStorage.getItem("bookHistory")
        ) || [];

    const records =
        history.filter(
            h => h.serial === serial
        );

    let html = "";

    records.forEach((record, index) => {

        html += `
        <tr>

            <td>${index + 1}</td>

            <td>${record.studentName}</td>

            <td>${record.roll}</td>

            <td>${record.issueDate}</td>

            <td>${record.returnDate || "-"}</td>

            <td>${record.status}</td>

        </tr>
        `;

    });

    document.getElementById(
        "bookHistoryTable"
    ).innerHTML = html;

    showSection(
        "bookHistorySection"
    );
}



function sendStudentOTP() {
    const roll = document.getElementById("studentLoginRoll").value;
    const phone = document.getElementById("studentLoginPhone").value;

    const students = JSON.parse(localStorage.getItem("students")) || [];

    const student = students.find(s => s.roll === roll && s.phone === phone);

    if (!student) {
        alert("Student not found");
        return;
    }

    otpStore = Math.floor(1000 + Math.random() * 9000);

    alert("OTP sent (demo): " + otpStore);
}




function verifyStudentOTP() {
    const enteredOtp = document.getElementById("studentOtp").value;

    if (enteredOtp == otpStore) {
        studentLoggedIn = document.getElementById("studentLoginRoll").value;
        alert("Student Login Success");
    } else {
        alert("Invalid OTP");
    }
}




function downloadMyReport() {

    if (!studentLoggedIn) {
        alert("Student not logged in");
        return;
    }

    const history = JSON.parse(localStorage.getItem("bookHistory")) || [];

    const myRecords = history.filter(h => h.roll === studentLoggedIn);

    let report = "MY LIBRARY REPORT\n\n";

    myRecords.forEach(r => {
        report += `${r.bookName} | ${r.issueDate} | ${r.returnDate || "Not Returned"} | ${r.status}\n`;
    });

    const blob = new Blob([report], { type: "text/plain" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = studentLoggedIn + "_report.txt";
    link.click();
}