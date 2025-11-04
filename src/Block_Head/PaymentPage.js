import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { person, vacatingDate } = location.state || {};

  const [rate, setRate] = useState(200);
  const [daysStayed, setDaysStayed] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (person?.allocationDate && vacatingDate) {
      const start = new Date(person.allocationDate);
      const end = new Date(vacatingDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      setDaysStayed(diffDays);
      setTotalAmount(diffDays * rate);
    }
  }, [person, vacatingDate, rate]);

  const handlePaymentAndVacate = async () => {
    if (!person || !person._id) {
      alert('Person data missing');
      return;
    }

    try {
      // First generate PDF
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('Room Management System - Payment Receipt', 20, 20);
      doc.text(`Name: ${person.name}`, 20, 40);
      if (person.pen) doc.text(`PEN: ${person.pen}`, 20, 50);
      if (person.recruitmentNumber) doc.text(`Recruitment No: ${person.recruitmentNumber}`, 20, 60);
      doc.text(`Block: ${person.block}`, 20, 70);
      doc.text(`Room: ${person.roomNumber}`, 20, 80);
      doc.text(`Allocation Date: ${new Date(person.allocationDate).toLocaleDateString()}`, 20, 90);
      doc.text(`Vacating Date: ${new Date(vacatingDate).toLocaleDateString()}`, 20, 100);
      doc.text(`Days Stayed: ${daysStayed}`, 20, 110);
      doc.text(`Rate per Day: ₹${rate}`, 20, 120);
      doc.text(`Total Amount: ₹${totalAmount}`, 20, 130);
      doc.save(`${person.name}_receipt.pdf`);

      // Now vacate from DB
      await fetch(`http://localhost:5000/api/roomallocations/${person._id}`, {
        method: 'DELETE',
      });

      alert('Payment successful. Room vacated.');
      navigate('/blockhead/dashboard/' + person.block);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || 'Error completing payment and vacating.');
    }
  };

  if (!person || !vacatingDate) {
    return <div style={{ padding: '20px' }}><h2>Missing data for payment.</h2></div>;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Payment & Vacating</h2>
      <div style={{ border: '1px solid gray', padding: '20px', borderRadius: '10px' }}>
        <p><strong>Name:</strong> {person.name}</p>
        {person.pen && <p><strong>PEN:</strong> {person.pen}</p>}
        {person.recruitmentNumber && <p><strong>Recruitment No:</strong> {person.recruitmentNumber}</p>}
        <p><strong>Block:</strong> {person.block}</p>
        <p><strong>Room:</strong> {person.roomNumber}</p>
        <p><strong>Allocation Date:</strong> {new Date(person.allocationDate).toLocaleDateString()}</p>
        <p><strong>Vacating Date:</strong> {new Date(vacatingDate).toLocaleDateString()}</p>
        <p><strong>Days Stayed:</strong> {daysStayed} day(s)</p>

        <label>Rate per Day (₹)</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setRate(val);
            setTotalAmount(val * daysStayed);
          }}
          style={{ padding: '5px', width: '100%' }}
        />

        <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
      </div>

      <button
        onClick={handlePaymentAndVacate}
        style={{
          marginTop: '20px',
          background: 'green',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}
      >
        Confirm & Generate Receipt
      </button>
    </div>
  );
};

export default PaymentPage;
