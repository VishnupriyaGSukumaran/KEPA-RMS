import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const PaymentReceipt = () => {
  const location = useLocation();
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  // Get the pen from the state passed via navigate
  const pen = location.state?.pen;

  useEffect(() => {
    if (pen) {
      axios.get(`http://localhost:5000/api/vacate/receipt/${pen}`)
        .then(res => setReceiptData(res.data))
        .catch(err => setError('Failed to fetch receipt data'));
    } else {
      setError('No PEN provided');
    }
  }, [pen]);

  if (error) return <div>{error}</div>;
  if (!receiptData) return <div>Loading...</div>;

  return (
    <div className="receipt-container">
      <div className="receipt-box">
        <h2>Payment Receipt</h2>
        <p><strong>Receipt ID:</strong> {receiptData.receiptId}</p>
        <p><strong>Name:</strong> {receiptData.name}</p>
        <p><strong>PEN:</strong> {receiptData.pen}</p>
        <p><strong>Block:</strong> {receiptData.blockName}</p>
        <p><strong>Room No:</strong> {receiptData.roomNumber}</p>
        <p><strong>Vacated On:</strong> {receiptData.vacateDate}</p>
        <p><strong>Amount Paid:</strong> {receiptData.amountPaid}</p>
        <p><strong>Payment Date:</strong> {receiptData.paymentDate}</p>
      </div>
    </div>
  );
};

export default PaymentReceipt;
