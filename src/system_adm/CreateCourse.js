import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import './CreateCourse.css';

function CreateCourse() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ courseName: '', coordinator: '', subcoordinator: '' });
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      setCourses(res.data);
    } catch (err) {
      toast.error('Failed to fetch courses.');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/courses/${editId}`, form);
        toast.success('Course updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/courses', form);
        toast.success('Course added successfully!');
      }
      setForm({ courseName: '', coordinator: '', subcoordinator: '' });
      setEditId(null);
      fetchCourses();
    } catch (err) {
      toast.error('Error saving course.');
    }
  };
  const handleClear = () => {
  setForm({
    courseName: '',
    coordinator: '',
    subcoordinator: '',
    startdate: '',
    enddate: '',
  });
  setEditId(null);
};

  const handleEdit = course => {
    setForm(course);
    setEditId(course._id);
  };

  const handleDelete = async id => {
    const confirmDelete = window.confirm('Are you sure you want to delete this course?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`);
      toast.success('Course deleted successfully!');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete course.');
    }
  };

  return (
    <div className="course-management-container">
      <ToastContainer />

      {/* Top Header - New Style */}
      <header className="top-header">
        <div className="logo-title">
          <img src="/logo.png" alt="Kerala Police" className="logo" />
          <div>
            <div className="rams">RAMS</div>
            <div className="subheading">Kerala Police</div>
          </div>
        </div>
        <div className="top-center">System Admin</div>
        <div className="top-right">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/login')}>Logout</button>
        </div>
      </header>

      {/* Header and Back */}
      <div className="heading-bar">
        <h2 >Course Management</h2>
        <button onClick={() => navigate('/superadmin/dashboard')} className="back-btn">
          Back 
        </button>
      </div>

      {/* Form */}
      {/* <form onSubmit={handleSubmit} className="course-form">
        <input type="text" name="courseName" placeholder="Course Name" value={form.courseName} onChange={handleChange} required />
        <input type="text" name="coordinator" placeholder="Coordinator" value={form.coordinator} onChange={handleChange} required />
        <input type="text" name="subcoordinator" placeholder="Subcoordinator" value={form.subcoordinator} onChange={handleChange} />
        <input type="date" name="startdate" placeholder="StartDate" value={form.startdate} onChange={handleChange} />
        <input type="date" name="enddate" placeholder="EndDate" value={form.enddate} onChange={handleChange} />
        <button type="submit">{editId ? 'Update' : 'Add'} Course</button>
      </form> */}

     <form onSubmit={handleSubmit} className="course-form">
  <div className="form-group">
    <label htmlFor="courseName">Course Name :     </label>
    <input type="text" id="courseName" name="courseName" value={form.courseName} onChange={handleChange} required />
  </div>
  <div className="form-group">
    <label htmlFor="coordinator">Coordinator :     </label>
    <input type="text" id="coordinator" name="coordinator" value={form.coordinator} onChange={handleChange} required />
  </div>
  <div className="form-group">
    <label htmlFor="subcoordinator">Subcoordinator :     </label>
    <input type="text" id="subcoordinator" name="subcoordinator" value={form.subcoordinator} onChange={handleChange} />
  </div>
  <div className="form-group">
    <label htmlFor="startdate">Start Date :     </label>
    <input type="date" id="startdate" name="startdate" value={form.startdate} onChange={handleChange} />
  </div>
  <div className="form-group">
    <label htmlFor="enddate">End Date :     </label>
    <input type="date" id="enddate" name="enddate" value={form.enddate} onChange={handleChange} />
  </div>
  <div className="form-button-wrapper">
    <button className="submit-btn" type="submit">{editId ? 'Update' : 'Add'} Course</button>
  </div>
   <button className="clear-btn" type="button" onClick={handleClear}>
    Clear
  </button>
</form>




      {/* Table */}
      <table className="course-table">
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Coordinator</th>
            <th>Subcoordinator</th>
            <th>StartDate</th>
            <th>EndDate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course._id}>
              <td>{course.courseName}</td>
              <td>{course.coordinator}</td>
              <td>{course.subcoordinator}</td>
              <td>{course.startdate}</td>
              <td>{course.enddate}</td>
              <td>
                <button onClick={() => handleEdit(course)}>Edit</button>
                <button onClick={() => handleDelete(course._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CreateCourse;
