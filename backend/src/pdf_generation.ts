import html2pdf from "html2pdf.js"; // tem q dar npm install html2pdf.js   pq eu nn consigo fazer isso no arquivos dos outro

const botaopdf  = document.querySelector("#gerar-pdf") //tem q colocar o id do botão para gerar pdf como gerar pdf, uau

botaopdf.addEventListener("click",() =>{

    const content = document.querySelector("#content")

    const options = {
        margin: [10,10,10,10],
        filename: "sla.pdf",
        html2canvas: {scale: 2},
        jsPDF: {unit: "mm", format: "a4", orientation: "portrait"}
    }

    html2pdf().set(options).from(content).save();

})

//tem q colocar isso aq no html ó
//<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.14.0/html2pdf.js" integrity="sha512-gZ2Hui9X2leHk1qe04MjNnYn49WrHXOcjB5k72h+kzGjNPMNyoqmP8IAhUD9XuF6AD+083y1lGx06Plf2U+Omg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

//npm install html2pdf