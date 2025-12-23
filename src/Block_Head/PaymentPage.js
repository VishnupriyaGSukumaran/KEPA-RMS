import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { person, vacatingDate } = location.state || {};

  const [rate, setRate] = useState(200);
  const [daysStayed, setDaysStayed] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      console.log('💳 Starting payment and vacating process...');
      console.log('📋 Person ID:', person._id);
      console.log('📅 Vacating Date:', vacatingDate);
      console.log('💰 Total Amount:', totalAmount);

      // ✅ FIRST: Delete allocation WITH all vacating details
      const deleteResponse = await axios.delete(
        `http://localhost:5000/api/roomallocations/${person._id}`,
        {
          data: {
            vacatingDate: vacatingDate,
            paid: 'Yes',
            vacatedBy: localStorage.getItem('username') || 'System',
            rate: rate,
            daysStayed: daysStayed,
            totalAmount: totalAmount
          }
        }
      );

      console.log('✅ Vacating response:', deleteResponse.data);

      // ✅ THEN: Generate PDF receipt
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Room Management System', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Payment Receipt', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      let yPos = 50;
      
      doc.text(`Name: ${person.name}`, 20, yPos);
      yPos += 10;
      
      if (person.pen) {
        doc.text(`PEN: ${person.pen}`, 20, yPos);
        yPos += 10;
      }
      
      if (person.recruitmentNumber) {
        doc.text(`Recruitment No: ${person.recruitmentNumber}`, 20, yPos);
        yPos += 10;
      }
      
      doc.text(`Block: ${person.blockName || person.block}`, 20, yPos);
      yPos += 10;
      
      doc.text(`Room: ${person.roomNumber}`, 20, yPos);
      yPos += 10;
      
      doc.text(`Allocation Date: ${new Date(person.allocationDate).toLocaleDateString()}`, 20, yPos);
      yPos += 10;
      
      doc.text(`Vacating Date: ${new Date(vacatingDate).toLocaleDateString()}`, 20, yPos);
      yPos += 10;
      
      doc.text(`Days Stayed: ${daysStayed} day(s)`, 20, yPos);
      yPos += 10;
      
      doc.text(`Rate per Day: ₹${rate}`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(14);
      doc.text(`Total Amount Paid: ₹${totalAmount}`, 20, yPos);
      yPos += 20;
      
      doc.setFontSize(10);
      doc.text(`Receipt generated on: ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 10;
      doc.text(`Vacated by: ${localStorage.getItem('username') || 'System'}`, 20, yPos);
      
      doc.save(`Receipt_${person.name}_${new Date().getTime()}.pdf`);

      // Clear triggers and refresh
      localStorage.removeItem('triggerViewBlockRefresh');
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.setItem('triggerViewBlockRefresh', Date.now().toString());

      alert('✅ Payment successful! Room vacated and receipt generated.');

      // Navigate back to block view
      navigate(`/blockhead/ViewBlock/${encodeURIComponent(person.blockName || person.block)}`, {
        replace: true,
        state: { 
          forceRefresh: true,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('❌ Payment and vacating error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.details
        || error.message 
        || 'Error completing payment and vacating.';
      
      alert(`❌ Error: ${errorMsg}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  if (!person || !vacatingDate) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Missing data for payment.</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Payment & Vacating</h2>
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '10px',
        backgroundColor: '#f9f9f9'
      }}>
        <p><strong>Name:</strong> {person.name}</p>
        {person.pen && <p><strong>PEN:</strong> {person.pen}</p>}
        {person.recruitmentNumber && <p><strong>Recruitment No:</strong> {person.recruitmentNumber}</p>}
        <p><strong>Block:</strong> {person.blockName || person.block}</p>
        <p><strong>Room:</strong> {person.roomNumber}</p>
        <p><strong>Allocation Date:</strong> {new Date(person.allocationDate).toLocaleDateString()}</p>
        <p><strong>Vacating Date:</strong> {new Date(vacatingDate).toLocaleDateString()}</p>
        <p><strong>Days Stayed:</strong> {daysStayed} day(s)</p>

        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Rate per Day (₹)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setRate(val);
              setTotalAmount(val * daysStayed);
            }}
            style={{ 
              padding: '8px', 
              width: '100%', 
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>

        <p style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#2c5f2d',
          marginTop: '15px'
        }}>
          <strong>Total Amount:</strong> ₹{totalAmount}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          disabled={loading}
          style={{
            background: '#6c757d',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
        
        <button
          onClick={handlePaymentAndVacate}
          disabled={loading}
          style={{
            flex: 1,
            background: loading ? '#6c757d' : '#28a745',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : 'Confirm Payment & Generate Receipt'}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;