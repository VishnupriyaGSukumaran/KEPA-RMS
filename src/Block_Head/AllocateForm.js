import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AllocateForm.css';

const AllocateForm = () => {
  const { purpose } = useParams();
  const navigate = useNavigate();
  const decodedPurpose = decodeURIComponent(purpose || '');
   
  const blockName = localStorage.getItem('assignedBlock');
  const allocatedBy = localStorage.getItem('pen');
  
  const initialState = {
    name: '',
    pen: '',
    recruitmentNumber: '',
    trainingCompany: '',
    mobileNumber: '',
    emergencyContact: '',
    address: '',
    designation: '',
    unit: '',
    district: '',
    courseDetails: '',
    remark: '',
    roomNumber: '',
    allocationDate: '',
    purpose: decodedPurpose,
    subPurpose: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courses');
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };

    const savedData = localStorage.getItem('allocationForm');
  if (savedData) {
    setFormData(JSON.parse(savedData));
    localStorage.removeItem('allocationForm');  // Optional: clear after use
  }
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (decodedPurpose !== 'Basic Training' && !/^[0-9]{6,}$/.test(formData.pen)) {
      alert('PEN number must be at least 6 digits.');
      return;
    }



if (!blockName || !allocatedBy) {
  alert('Missing block or allocator information. Please log in again.');
  return;
}

    const payload = {
      ...formData,
      blockName,
      allocatedBy
    };

    try {
      const response = await fetch('http://localhost:5000/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Room allocated successfully!');
        navigate('/BlockHeadDashboard');
         } else if (response.status === 409) {
        const data = await response.json();
        alert(data.error || 'This PEN is already allocated.');
      } else {
        alert('Error allocating room.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to connect to server.');
    }
  };

  const renderFields = () => {
    if (decodedPurpose === 'Guest / Faculty' || decodedPurpose === 'Others') {
      return (
        <>
        <div className="form-group">
        <label>PEN Number:</label>
        <input type="text" name="pen" value={formData.pen} onChange={handleChange} required />
      </div>
          <div className="form-group">
            <label>Select Purpose Type:</label>
            <select name="subPurpose" value={formData.subPurpose} onChange={handleChange} required>
              <option value="">-- Select --</option>
              <option value="Course">Course</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {formData.subPurpose === 'Course' && (
            <>
              <div className="form-group">
                <label>Unit:</label>
                <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>District:</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} required />
              </div>
              <div className="form-group full-width">
                <label>Course Details:</label>
                <select name="courseDetails" value={formData.courseDetails} onChange={handleChange} required>
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option
                      key={course._id}
                      value={`${course.courseName} (${course.startdate} to ${course.enddate})`}
                    >
                      {course.courseName} ({course.startdate} to {course.enddate})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {formData.subPurpose === 'Others' && (
            <div className="form-group full-width">
              <label>Remark (Purpose of Visit):</label>
              <input type="text" name="remark" value={formData.remark} onChange={handleChange} required />
            </div>
          )}
        </>
      );
    }

    switch (decodedPurpose) {
      case 'Basic Training':
        return (
          <>
            <div className="form-group">
              <label>Recruitment Number:</label>
              <input type="text" name="recruitmentNumber" value={formData.recruitmentNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Purpose of Visit:</label>
              <input type="text" name="purpose" value={formData.purpose} readOnly />
            </div>
            <div className="form-group">
              <label>Training Company:</label>
              <input type="text" name="trainingCompany" value={formData.trainingCompany} onChange={handleChange} required />
            </div>
          </>
        );
      case 'Inservice Training':
        return (
          <>
            <div className="form-group">
              <label>PEN Number:</label>
              <input type="text" name="pen" value={formData.pen} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Purpose of Visit:</label>
              <input type="text" name="purpose" value={formData.purpose} readOnly />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>District:</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} required />
            </div>
            <div className="form-group full-width">
              <label>Course Details:</label>
              <select name="courseDetails" value={formData.courseDetails} onChange={handleChange} required>
                <option value="">-- Select Course --</option>
                {courses.map((course) => (
                  <option
                    key={course._id}
                    value={`${course.courseName} (${course.startdate} to ${course.enddate})`}
                  >
                    {course.courseName} ({course.startdate} to {course.enddate})
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      case 'KEPA Officials':
        return (
          <>
            <div className="form-group">
              <label>PEN Number:</label>
              <input type="text" name="pen" value={formData.pen} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Purpose of Visit:</label>
              <input type="text" name="purpose" value={formData.purpose} readOnly />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>District:</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} required />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="allocate-room-container form-wrapper">
      <h2>Room Allocation Form</h2>
      <form onSubmit={handleSubmit} className="allocation-form">
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        {renderFields()}

        <div className="form-group">
          <label>Mobile Number:</label>
          <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Emergency Contact Number:</label>
          <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required />
        </div>

        <div className="form-group full-width">
          <label>Address (Office or Home):</label>
          <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" />
        </div>

        <div className="form-group">
          <label>Designation:</label>
          <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Allocation Date:</label>
          <input type="date" name="allocationDate" value={formData.allocationDate} onChange={handleChange} required />
        </div>

        <div className="form-group room-check full-width">
          <div className="room-input">
            <label>Room Number:</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required />
          </div>
          <button
  type="button"
  className="check-vacancy-btn"
  onClick={() => {
    localStorage.setItem('allocationForm', JSON.stringify(formData));
    navigate(`/blockhead/ViewBlock/${encodeURIComponent(blockName)}`);
  }}
>
  Check Vacancies
</button>

        </div>

        <div className="form-group full-width">
          <button type="submit" className="submit-btn">Allocate Room</button>
        </div>
      </form>
    </div>
  );
};

export default AllocateForm;
