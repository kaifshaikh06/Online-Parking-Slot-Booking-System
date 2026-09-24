import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import SlotForm from "../components/SlotForm";

const emptySlot = {
  slotNumber: "",
  location: "Level A",
  vehicleType: "Sedan",
  price: "50",
  status: "Available",
};
const AddSlot = () => {
  const navigate = useNavigate();
  const save = async (values) => {
    try {
      await api.post("/slots", values);
      navigate("/admin/slots", {
        state: { success: "Parking slot added successfully." },
      });
    } catch (error) {
      throw getErrorMessage(error);
    }
  };
  return (
    <main className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin area</p>
          <h1>Add Parking Slot</h1>
        </div>
      </div>
      <SlotForm
        initialValues={emptySlot}
        onSubmit={save}
        submitLabel="Add Parking Slot"
      />
    </main>
  );
};

export default AddSlot;
