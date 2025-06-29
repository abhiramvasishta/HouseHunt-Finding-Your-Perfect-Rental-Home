import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { motion } from "framer-motion";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const Search = () => {
  const [homes, setHomes] = useState([]);
  const [filteredHomes, setFilteredHomes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [rentFilter, setRentFilter] = useState("");
  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [uniquePincodes, setUniquePincodes] = useState([]);
  const [uniqueStates, setUniqueStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const navigate = useNavigate();
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/homes/get`);
        const homesData = response.data.map((home) => ({
          ...home,
          renter: home.renter || null,
        }));
        setHomes(homesData);
        console.log(response.data);

        setFilteredHomes(homesData);

        // Set unique options
        setUniqueDistricts([...new Set(homesData.map((home) => home.town))]);
        setUniquePincodes([...new Set(homesData.map((home) => home.pincode))]);
        setUniqueStates([...new Set(homesData.map((home) => home.state))]);
      } catch (err) {
        setError("Failed to load homes");
      } finally {
        setLoading(false);
      }
    };
    const fetchCommits = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/commit/getall`);
        setCommits(response.data);
        console.log(response.data);
      } catch (err) {
        setError("Failed to load commits");
      } finally {
        setLoading(false);
      }
    };

    fetchHomes();
    fetchCommits();
  }, []);

  useEffect(() => {
    const filtered = homes.filter((home) => {
      const matchesSearch = `${home.title} ${home.street} ${home.town} ${home.state}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesDistrict = !districtFilter || home.town === districtFilter;
      const matchesPincode = !pincodeFilter || home.pincode.toString() === pincodeFilter;
      const matchesState = !stateFilter || home.state === stateFilter;
      const matchesRent = !rentFilter || home.rentprice <= parseInt(rentFilter);

      return matchesSearch && matchesDistrict && matchesPincode && matchesState && matchesRent;
    });

    setFilteredHomes(filtered);
  }, [searchQuery, districtFilter, pincodeFilter, stateFilter, rentFilter, homes]);

  const handleShowRenterDetails = (renter, home) => {
    setSelectedRenter({ ...renter, homeId: home._id });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRenter(null);
    setPaymentScreenshot(null);
  };

  const handleCommit = async () => {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("renterId", selectedRenter._id);
    formData.append("homeId", selectedRenter.homeId);
    formData.append("screenshot", paymentScreenshot);

    try {
      await axios.post(`${apiBaseUrl}/commit/post`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleCloseModal();
      alert("Commit successful!");
    } catch (err) {
      console.error(err);
      alert("Failed to commit!");
    }
  };

  return (
    <div className="text-white p-4">
      <motion.h2
        className="text-2xl font-semibold mb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🏠 Available Homes
      </motion.h2>
      <motion.div className="flex flex-wrap gap-4 justify-center mb-5">
        <input
          type="text"
          placeholder="🔍 Search by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 w-100 text-white bg-gray-700 border border-gray-300 rounded-md shadow-sm"
        />
      </motion.div>
      {/* Filters */}
      <motion.div className="flex flex-wrap gap-4 justify-center mb-5">
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="p-2 text-white bg-gray-700 border border-gray-300 rounded-md"
        >
          <option value="">🏢 All Districts</option>
          {uniqueDistricts.map((district, idx) => (
            <option key={idx} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          value={pincodeFilter}
          onChange={(e) => setPincodeFilter(e.target.value)}
          className="p-2 text-white bg-gray-700 border border-gray-300 rounded-md"
        >
          <option value="">📮 All Pincodes</option>
          {uniquePincodes.map((pin, idx) => (
            <option key={idx} value={pin}>
              {pin}
            </option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="p-2 text-white bg-gray-700 border border-gray-300 rounded-md"
        >
          <option value="">🌍 All States</option>
          {uniqueStates.map((state, idx) => (
            <option key={idx} value={state}>
              {state}
            </option>
          ))}
        </select>

        <select
          value={rentFilter}
          onChange={(e) => setRentFilter(e.target.value)}
          className="p-2 text-white bg-gray-700 border border-gray-300 rounded-md"
        >
          <option value="">💰 Any Rent</option>
          <option value="3000">Up to ₹3,000</option>
          <option value="5000">Up to ₹5,000</option>
          <option value="10000">Up to ₹10,000</option>
          <option value="20000">Up to ₹20,000</option>
        </select>
      </motion.div>

      {/* Homes Display */}
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredHomes.map((home, index) => (
          <motion.div
            key={home._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#1f2937] to-[#111827] p-4 rounded-2xl shadow-2xl border border-gray-800 hover:border-blue-600 transition w-full max-w-[320px] mx-auto"
          >
            <div className="rounded-xl overflow-hidden mb-4">
              <Carousel showThumbs={false} infiniteLoop autoPlay interval={5000} showStatus={false}>
                {home.images?.map((img, i) =>
                  img?.base64 && img?.contentType ? (
                    <img
                      key={i}
                      src={`data:${img.contentType};base64,${img.base64}`}
                      alt={`Home ${i}`}
                      className="object-cover h-[200px] w-full"
                    />
                  ) : null
                )}
              </Carousel>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{home.title}</h3>
            <p className="text-gray-300 text-sm mb-2">
              📍 {home.street}, {home.town}, {home.state}
            </p>
            <p className="text-green-400 text-md font-semibold mb-4">
              💰 Rent: ₹{home.rentprice}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Code: {home.pluscode.split(" ")[0]}</span>
              {home.renter && (
                <button
                  onClick={() => handleShowRenterDetails(home.renter, home)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold py-1 px-3 rounded-lg transition"
                >
                  Renter Info
                </button>
              )}
            </div>
            {/* This button was duplicated and misplaced. It should be part of the home card if needed. */}
            {/* If you want a separate button outside the card, it needs to be handled differently. */}
            {/* For now, I'm assuming the button inside the card is sufficient. */}
            {/* If a separate button is desired, it would need to be outside the map and reference a specific home. */}
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {showModal && selectedRenter && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-700 backdrop-blur-md bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[95%] max-w-4xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">Complete Your Payment</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 text-center">
                <p className="text-indigo-700 text-2xl mb-2 animate-bounce">
                  Pay ₹50 to Easy Homes
                </p>

                <p className="text-base text-gray-800 font-medium mb-4 hidden md:block">
                  🖥️ Using a laptop or desktop?<br />
                  Scan the QR code below with any UPI app <br />(PhonePe, GPay, Paytm, etc.)
                </p>

                <div className="hidden md:block mb-6">
                  <img
                    src="/dist/upi_qr.png"
                    alt="UPI QR for Abhi Homes"
                    className="mx-auto rounded-xl shadow-lg border-4 border-blue-200 w-64 h-64 object-contain"
                  />
                </div>
                <div className="md:hidden mt-4">
                  <p className="text-base text-gray-800 font-medium mb-6">
                    📱 On mobile? Just tap the button below to open your UPI app.
                  </p>
                  <a
                    href="upi://pay?pa=8919348949@upi&pn=EasyHomes&am=50&cu=INR&tn=home%20payment"
                    className="bg-blue-600 hover:bg-blue-700 text-lg text-white font-semibold py-3 px-6 rounded-full transition duration-200"
                  >
                    Pay with UPI App
                  </a>
                </div>
              </div>

              <div className="md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mt-3">Renter Name</label>
                <input
                  type="text"
                  value={`${selectedRenter.firstname} ${selectedRenter.lastname}`}
                  disabled
                  className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md"
                />

                <label className="block text-sm font-medium text-gray-700 mt-3">Renter ID</label>
                <input
                  type="text"
                  value={selectedRenter._id}
                  disabled
                  className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md"
                />

                <label className="block text-sm font-medium text-gray-700 mt-3">Home ID</label>
                <input
                  type="text"
                  value={selectedRenter.homeId}
                  disabled
                  className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md"
                />

                <label className="block text-sm font-medium text-gray-700 mt-3">Your User ID</label>
                <input
                  type="text"
                  value={userId}
                  disabled
                  className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md"
                />

                <label className="block text-sm font-medium text-gray-700 mt-3">Upload Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                  className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md"
                />

                <button
                  onClick={handleCommit}
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Confirm Payment
                </button>

                <button
                  onClick={handleCloseModal}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Back To Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
