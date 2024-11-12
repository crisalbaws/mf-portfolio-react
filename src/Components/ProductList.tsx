import React, { useState, useEffect } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Snackbar,
  Modal,
  Button,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import "../Styles/Styles.css";
import { demoProducts } from "./Utils";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

const ProductList: React.FC = () => {
  const [products] = useState<Product[]>(demoProducts);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [gridWidth, setGridWidth] = useState<number>(0);
  const [columnCount, setColumnCount] = useState<number>(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">(
    "success"
  );
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    cardNumber: "",
  });

  const columnWidth = 220;
  const columnGap = 20;
  const adjustedColumnWidth = columnWidth + columnGap;

  useEffect(() => {
    const savedQuantities = localStorage.getItem("quantities");
    if (savedQuantities) {
      setQuantities(JSON.parse(savedQuantities));
    }

    const handleResize = () => {
      const newWidth = window.innerWidth;
      setGridWidth(newWidth);
      setColumnCount(Math.floor(newWidth / adjustedColumnWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("quantities", JSON.stringify(quantities));
    calculateTotalAmount();
  }, [quantities]);

  const calculateTotalAmount = () => {
    const total = products.reduce((sum, product) => {
      const quantity = quantities[product.id] || 0;
      return sum + product.price * quantity;
    }, 0);
    setTotalAmount(total);
  };

  const increaseQuantity = (id: number) => {
    setQuantities((prevQuantities) => {
      const newQuantity = (prevQuantities[id] || 0) + 1;
      setToastMessage(
        `${products.find((product) => product.id === id)?.name} agregado!`
      );
      setToastSeverity("success");
      return {
        ...prevQuantities,
        [id]: newQuantity,
      };
    });
  };

  const decreaseQuantity = (id: number) => {
    setQuantities((prevQuantities) => {
      const newQuantity = Math.max((prevQuantities[id] || 0) - 1, 0);
      if (newQuantity === 0) {
        setToastMessage(
          `${products.find((product) => product.id === id)?.name} eliminado!`
        );
        setToastSeverity("error");
      }
      return {
        ...prevQuantities,
        [id]: newQuantity,
      };
    });
  };

  const handleImageError = (id: number) => {
    setImageError((prevErrors) => ({
      ...prevErrors,
      [id]: true,
    }));
  };

  const renderCell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    const imageExists = !imageError[product.id];
    const quantity = quantities[product.id] || 0;

    return (
      <div
        style={{ ...style, padding: "10px", boxSizing: "border-box" }}
        key={product.id}
      >
        <Card
          className="product-card"
          style={{
            width: "100%",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            borderRadius: "8px",
          }}
        >
          {imageExists ? (
            <CardMedia
              component="img"
              image={product.imageUrl}
              alt={product.name}
              className="product-card-media"
              onError={() => handleImageError(product.id)}
            />
          ) : (
            <div className="text-card-media">
              <Typography variant="h6" component="div">
                Sin Imagen
              </Typography>
            </div>
          )}
          <CardContent className="card-content">
            <Typography variant="h6" component="div">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${product.price.toFixed(2)}
            </Typography>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              <IconButton
                onClick={() => decreaseQuantity(product.id)}
                disabled={quantity === 0}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="body1" style={{ margin: "0 10px" }}>
                {quantity}
              </Typography>
              <IconButton onClick={() => increaseQuantity(product.id)}>
                <AddIcon />
              </IconButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const totalQuantity = Object.values(quantities).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const handleOpenModal = () => {
    const quantities = JSON.parse(localStorage.getItem("quantities"));
    if (!quantities || Object.keys(quantities).length === 0) {
      return;
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCheckoutModalOpen = () => {
    setCheckoutModalOpen(true);
    handleCloseModal();
  };

  const handleCheckoutModalClose = () => {
    setCheckoutModalOpen(false);
  };

  const handleClearCart = () => {
    setQuantities({});
    setToastMessage("Carrito limpiado!");
    setToastSeverity("error");
    handleCloseModal();
  };

  const handleCheckout = () => {
    handleCheckoutModalOpen();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFormSubmit = () => {
    if (!formData.name || !formData.address || !formData.cardNumber) {
      setToastMessage("Por favor, completa todos los campos requeridos.");
      setToastSeverity("error");
      return;
    }
    const folio: number = new Date().getTime();
    const docDefinition = {
      content: [
        { text: "Folio de la compra: " + folio, style: "header" },
        { text: `Nombre: ${formData.name}`, margin: [0, 10] },
        { text: `Domicilio: ${formData.address}`, margin: [0, 10] },
        { text: `Número de Tarjeta: ${formData.cardNumber}`, margin: [0, 10] },
        { text: `Total a Pagar: $${totalAmount.toFixed(2)}`, margin: [0, 10] },
        { text: "Detalles de la Compra:", style: "subheader", margin: [0, 20] },
        {
          table: {
            body: [
              ["Producto", "Cantidad", "Precio"],
              ...products
                .map((product) => {
                  const quantity = quantities[product.id] || 0;
                  const price = (quantity * product.price).toFixed(2);
                  return quantity > 0
                    ? [product.name, quantity, `$${price}`]
                    : null;
                })
                .filter((row) => row !== null),
            ],
          },
          margin: [0, 10],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 20, 0, 20],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 10],
        },
      },
    };

    pdfMake.createPdf(docDefinition).download("compra-" + folio + ".pdf");

    setToastMessage("Compra realizada con éxito!");
    setToastSeverity("success");
    handleCheckoutModalClose();
    setQuantities({});
  };

  return (
    <div style={{ width: "100vw", position: "relative" }}>
      <Grid
        height={700}
        width={gridWidth}
        columnCount={columnCount}
        columnWidth={adjustedColumnWidth}
        rowCount={Math.ceil(products.length / columnCount)}
        rowHeight={350}
      >
        {renderCell}
      </Grid>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <IconButton
          aria-label="cart"
          style={{
            backgroundColor: "#1976d2",
            color: "#fff",
            borderRadius: "50%",
            padding: "15px",
          }}
          onClick={handleOpenModal}
        >
          <Badge badgeContent={totalQuantity} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </div>

      <Snackbar
        open={!!toastMessage}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        ContentProps={{
          style: {
            backgroundColor: toastSeverity === "success" ? "green" : "red",
          },
        }}
      />

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <div
          className="modal-content"
          style={{
            fontFamily: "Montserrat, sans-serif",
            padding: "20px",
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <h2>Carrito de Compras</h2>
          <div>
            {products.map((product) => {
              const quantity = quantities[product.id] || 0;
              return quantity > 0 ? (
                <div
                  key={product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body1">
                    {product.name} - Cantidad: {quantity}
                  </Typography>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                      onClick={() => decreaseQuantity(product.id)}
                      disabled={quantity === 0}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography variant="body1" style={{ margin: "0 10px" }}>
                      {quantity}
                    </Typography>
                    <IconButton onClick={() => increaseQuantity(product.id)}>
                      <AddIcon />
                    </IconButton>
                  </div>
                </div>
              ) : null;
            })}
          </div>
          <Typography variant="h6" style={{ marginTop: "20px" }}>
            Total: ${totalAmount.toFixed(2)}
          </Typography>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearCart}
              style={{ marginRight: "10px" }}
            >
              Limpiar Carrito
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCloseModal}
              style={{ marginRight: "10px" }}
            >
              Cancelar
            </Button>
            <Button variant="outlined" color="primary" onClick={handleCheckout}>
              Proceder al Pago
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={checkoutModalOpen}>
        <div
          className="modal-content"
          style={{
            fontFamily: "Montserrat, sans-serif",
            padding: "20px",
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <h2>Formulario de Pago</h2>
          <Typography variant="h6">
            Total a Pagar: ${totalAmount.toFixed(2)}
          </Typography>
          <TextField
            label="Nombre Completo"
            variant="outlined"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Domicilio"
            variant="outlined"
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Número de Tarjeta"
            variant="outlined"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              onClick={handleCheckoutModalClose}
              style={{ marginRight: "10px" }}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleFormSubmit}
            >
              Confirmar Pago
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;
