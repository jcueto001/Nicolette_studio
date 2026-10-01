const express = require('express');
const cors = require('cors');
const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = require('transbank-sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint para crear una transacción en Webpay Plus
app.post('/api/webpay/create', async (req, res) => {
    try {
        const { buyOrder, sessionId, amount, returnUrl } = req.body;

        // Utilizamos WebpayPlus.Transaction con configuración de integración
        const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
        
        const createResponse = await tx.create(
            buyOrder,     // Orden de compra
            sessionId,    // ID de sesión
            amount,       // Monto
            returnUrl     // URL de retorno
        );

        res.json({
            token: createResponse.token,
            url: createResponse.url
        });
    } catch (error) {
        console.error("Error creating Webpay transaction:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para confirmar la transacción (returnUrl)
app.get('/api/webpay/commit', async (req, res) => {
    try {
        const token = req.query.token_ws;
        
        if (!token) {
            // Si el usuario canceló en el formulario de Transbank, Transbank redirecciona enviando 'TBK_TOKEN' u otros parámetros
            return res.send(`
                <html><body>
                    <h2>Pago cancelado o anulado.</h2>
                    <a href="https://tu-sitio-frontend.com">Volver al inicio</a>
                </body></html>
            `);
        }

        // Confirmar la transacción
        const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
        const commitResponse = await tx.commit(token);

        if (commitResponse.status === 'AUTHORIZED') {
            // Pago exitoso. Redirigimos al frontend con los datos.
            // (Reemplazar 'http://localhost:5500' por la URL real del frontend en producción)
            const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/index.html'; 
            res.redirect(`${frontendUrl}?action=webpay-success&buyOrder=${commitResponse.buy_order}&authCode=${commitResponse.authorization_code}`);
        } else {
            res.send(`
                <html><body>
                    <h2>El pago fue rechazado o falló.</h2>
                    <p>Estado: ${commitResponse.status}</p>
                    <a href="https://tu-sitio-frontend.com">Volver al inicio</a>
                </body></html>
            `);
        }
    } catch (error) {
        console.error("Error committing Webpay transaction:", error);
        res.send(`
            <html><body>
                <h2>Error al procesar el pago.</h2>
                <p>${error.message}</p>
            </body></html>
        `);
    }
});

app.listen(port, () => {
    console.log(`Backend de pagos escuchando en http://localhost:${port}`);
});
