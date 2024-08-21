import React, { useEffect, useState } from "react";
import "./coursedescription.css";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import Loading from "../../components/loading/Loading";

const CourseDescription = ({ user }) => {
  const params = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { fetchUser } = UserData();
  const { fetchCourse, course, fetchCourses, fetchMyCourse } = CourseData();

  useEffect(() => {
    fetchCourse(params.id);
  }, [params.id]);

  const checkoutHandler = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const { data: { order } } = await axios.post(
        `${server}/api/course/checkout/${params.id}`,
        {},
        {
          headers: {
            token,
          },
        }
      );

      const key = "rzp_test_PJr6q6d7t2Sat7"; // Replace with your actual Razorpay key
      if (!key) {
        throw new Error("Razorpay key is not defined");
      }

      const options = {
        key: key,
        amount: order.amount,
        currency: "INR",
        name: "E learning",
        description: "Learn with us",
        order_id: order.id,
        handler: async function (response) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

          try {
            const { data } = await axios.post(
              `${server}/api/verification/${params.id}`,
              {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              },
              {
                headers: {
                  token,
                },
              }
            );

            await fetchUser();
            await fetchCourses();
            await fetchMyCourse();
            toast.success(data.message);
            navigate(`/payment-success/${razorpay_payment_id}`);
          } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
          } finally {
            setLoading(false);
          }
        },
        theme: {
          color: "#8a4baf",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(error.response?.data?.message || "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        course && (
          <div className="course-description">
            <div className="course-header">
              <img
                src={`${server}/${course.image}`}
                alt="Course"
                className="course-image"
              />
              <div className="course-info">
                <h2>{course.title}</h2>
                <p>Instructor: {course.createdBy}</p>
                <p>Duration: {course.duration} weeks</p>
              </div>
            </div>

            <p>{course.description}</p>

            <p>Let's get started with course At ₹{course.price}</p>

            {user && user.subscription.includes(course._id) ? (
              <button
                onClick={() => navigate(`/course/study/${course._id}`)}
                className="common-btn"
              >
                Study
              </button>
            ) : (
              <button onClick={checkoutHandler} className="common-btn">
                Buy Now
              </button>
            )}
          </div>
        )
      )}
    </>
  );
};

export default CourseDescription;
