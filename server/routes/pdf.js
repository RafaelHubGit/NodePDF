const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const fs = require('fs');
const path = require('path');

const puppeteer = require('puppeteer');
const handlebars = require("handlebars");


// default options
app.use(fileUpload({ useTempFiles: true }));

app.put('/pdf', function (req, res) {    
    let archivo = req.files.archivo;
    let nombreCortado = archivo.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];
    let nombreArchivo = nombreCortado[0];

    if(!req.files){
        return res.status(400)
                    .json({
                        ok: false, 
                        err:{
                            message: 'No se ha cargado ningun archivo'
                        }
                    })
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    // let archivo = req.files.archivo;
  
    // Use the mv() method to place the file somewhere on your server
    archivo.mv(`archives/html/${nombreArchivo}.${extension}`, function(err) {
      if (err){
        return res.status(500).send(err);
      }

        

        creaPdf(nombreArchivo, extension).then( data => {
            res.sendFile(path.resolve(__dirname, `../../archives/PDF/${nombreArchivo}.pdf`), function (err){

                if(err){
                    console.log("Entra a error");
                    return res.json({
                        ok: false, 
                        message: "No se pudo enviar el archivo, intente de nuevo", 
                        err: err
                    });
                }else{
                    borraArchivo(nombreArchivo);
                }

            });
        }).catch( err => {
            console.log("ERROR CREA");
        });

    });

  });
 


// CREA PDF 
const creaPdf = async(nombreArchivo, extension) => {

    var dataBinding = {
        items: [{
                name: "item 1",
                price: 100
            },
            {
                name: "item 2",
                price: 200
            },
            {
                name: "item 3",
                price: 300
            }
        ],
        total: 600,
        isWatermark: true
    }

    
    let rutaDoctoHtml = path.resolve( __dirname, '../../archives/html');
    let rutaSalidaPdf = path.resolve( __dirname, '../../archives/PDF' ) + `/${nombreArchivo}.pdf`;
    // var templateHtml = fs.readFileSync(path.join(process.cwd(), rutaDoctoHtml), 'utf8');
    var templateHtml = fs.readFileSync(path.join(rutaDoctoHtml, `/${nombreArchivo}.html`), 'utf8');
    var template = handlebars.compile(templateHtml);
    var finalHtml = template(dataBinding);
    var options = {
        format: 'A4',
        // width: "21.6cm",
		// height: "27.9cm",
        headerTemplate: "<p></p>",
        footerTemplate: "<p></p>",
        displayHeaderFooter: false,
        // margin: {
        //     top: "40px",
        //     bottom: "100px"
        // },
        printBackground: true,
        path: rutaSalidaPdf
    }

    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(`data:text/html,${finalHtml}`, {
        waitUntil: 'networkidle0'
    });
    await page.pdf(options);
    await browser.close();

    console.log("HECHO");

}


function borraArchivo(nombreArchivo) {

    let pathArchivoPDF = path.resolve(__dirname, `../../archives/PDF/${ nombreArchivo }.pdf`);
    let pathArchivoHTML = path.resolve(__dirname, `../../archives/html/${ nombreArchivo }.html`);
    if (fs.existsSync(pathArchivoPDF)) {
        fs.unlinkSync(pathArchivoPDF);
    }

    if (fs.existsSync(pathArchivoHTML)) {
        fs.unlinkSync(pathArchivoHTML);
    }


}
  
module.exports = app;