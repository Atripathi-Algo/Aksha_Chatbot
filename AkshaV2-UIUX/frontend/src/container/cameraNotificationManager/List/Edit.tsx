import React, { useState, useEffect } from "react";
import { useApi } from "../../../hooks/useAPI";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@mui/material";
import Messagebox from "../../../component/common/messagebox/Messagebox";
import "./list.scss";


const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

interface CameraGroupType {
  _id: string;
  group_name: string;
}

const EditManager: React.FC<any> = ({ data, back, loadlist }: any) => {
  const { callApi } = useApi();
  const { t } = useTranslation();

  const [local, setLocal] = useState<any>(data);
  const [cameraGroups, setCameraGroups] = useState<CameraGroupType[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success");
  const [open, setOpen] = useState(false);

  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const [mobileChips, setMobileChips] = useState<string[]>([]);
  const [mobileInput, setMobileInput] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const [editingType, setEditingType] = useState<"email" | "mobile" | null>(null);




  // Load camera groups for dropdown
  useEffect(() => {
    callApi(`${react_app_base_url}/api/camgroup`, { method: "GET" })
      .then((res: any) => setCameraGroups(res.data?.groups ?? []))
      .catch(() => setCameraGroups([]));
  }, []);

  useEffect(() => {
    setLocal(data);

    // initialize email chips
    if (data?.email?.email_list) {
      setEmailChips(
        data.email.email_list
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean)
      );
    } else {
      setEmailChips([]);
    }

    // initialize mobile chips
    if (data?.mobile?.mobile_numbers) {
      setMobileChips(
        data.mobile.mobile_numbers
          .split(",")
          .map((m: string) => m.trim())
          .filter(Boolean)
      );
    } else {
      setMobileChips([]);
    }
  }, [data]);


  const update = () => {
    if (!local.camera_group_id) {
      setMessage(t("Please select a camera group"));
      setOpen(true);
      return;
    }
    const payload = {
      ...local,
      email: {
        ...local.email,
        email_list: emailChips.join(","),
      },
      mobile: {
        ...local.mobile,
        mobile_numbers: mobileChips.join(","),
      },
    };

    callApi(`${react_app_base_url}/api/notification/${local._id}`, {
      method: "PUT",
      body: payload,
    })
      .then(() => {
        setMessage(t("Updated successfully"));

        setMessageType("success");
        setOpen(true);
        // Auto-close after 0.7s and navigate back
        setTimeout(() => {
          setOpen(false);
          back();       // go back to panel
          loadlist();   // refresh the parent list
        }, 700);
      })
      .catch(() => {
        setMessage(t("genericError"));
        setMessageType("error");
        setOpen(true);
      });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidMobile = (mobile: string) => {
    // allows 10–15 digits, optional + at start
    return /^\+?\d{10}$/.test(mobile);
  };

  // EMAIL
  const addEmailChip = (value: string) => {
    const email = value.trim();

    if (!email) return;

    if (!isValidEmail(email)) {
      setMessage(t("Invalid email address"));
      setMessageType("warning");
      setOpen(true);
      return;
    }

    if (emailChips.includes(email)) return;

    setEmailChips((prev) => [...prev, email]);
    setEmailInput("");
  };


  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add chip
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addEmailChip(emailInput.replace(",", ""));
    }

    // Edit last chip
    if (e.key === "Backspace" && emailInput === "" && emailChips.length > 0) {
      const last = emailChips[emailChips.length - 1];
      setEmailChips((prev) => prev.slice(0, -1));
      setEmailInput(last);
    }
  };


  const removeEmail = (email: string) => {
    setEmailChips((prev) => prev.filter((e) => e !== email));
  };

  // MOBILE
  const addMobileChip = (value: string) => {
    const phone = value.trim();

    if (!phone) return;

    if (!isValidMobile(phone)) {
      setMessage(t("Invalid mobile number"));
      setMessageType("warning");
      setOpen(true);
      return;
    }

    if (mobileChips.includes(phone)) return;

    setMobileChips((prev) => [...prev, phone]);
    setMobileInput("");
  };


  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add chip
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addMobileChip(mobileInput.replace(",", ""));
    }

    // Edit last chip on backspace
    if (e.key === "Backspace" && mobileInput === "" && mobileChips.length > 0) {
      const last = mobileChips[mobileChips.length - 1];
      setMobileChips((prev) => prev.slice(0, -1));
      setMobileInput(last);
    }
  };


  const removeMobile = (phone: string) => {
    setMobileChips((prev) => prev.filter((m) => m !== phone));
  };

  const startEdit = (type: "email" | "mobile", index: number) => {
    setEditingType(type);
    setEditingIndex(index);
    setEditingValue(type === "email" ? emailChips[index] : mobileChips[index]);
  };


  const saveEdit = () => {
    if (editingType === "email") {
      if (!isValidEmail(editingValue)) {
        setMessage(t("Invalid email address"));
        setMessageType("warning");
        setOpen(true);
        return;
      }
      setEmailChips((prev) =>
        prev.map((e, i) => (i === editingIndex ? editingValue : e))
      );
    } else if (editingType === "mobile") {
      if (!isValidMobile(editingValue)) {
        setMessage(t("Invalid mobile number"));
        setMessageType("warning");
        setOpen(true);
        return;
      }
      setMobileChips((prev) =>
        prev.map((m, i) => (i === editingIndex ? editingValue : m))
      );
    }

    // Reset
    setEditingType(null);
    setEditingIndex(null);
    setEditingValue("");
  };


  const cancelEdit = () => {
    setEditingType(null);
    setEditingIndex(null);
    setEditingValue("");
  };


  return (
    <div style={{ marginLeft: 63 }}>
      <Messagebox
        open={open}
        handleClose={() => setOpen(false)}
        message={message}
        warning={messageType !== "success"}
      />

      <div>
        <h3
          style={{
            fontSize: "24px",          // slightly smaller
            fontWeight: "500",
            color: "#2f2f2f",          // soft charcol
            fontFamily: `"Inter", "Segoe UI", "Roboto", system-ui, sans-serif`,
            marginBottom: "4px",
            paddingBottom: "6px",
            marginLeft: "5px",
            letterSpacing: "0.2px",
            marginTop: "8px",
          }}
        >
          {t("Edit Notification Manager")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "20px" }}>
          <label style={{ fontWeight: 500 }}>
            {t("Camera Group")}
          </label>

          <input
            type="text"
            value={local.camera_group_id?.group_name || ""}
            disabled
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "42px",
              width: "530px",
            }}
          />
        </div>


        {/* Email */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "10px",
            width: "530px",
            maxWidth: "100%",
          }}
        >
          <label
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Checkbox
              checked={local.email?.enabled}
              onChange={(e) =>
                setLocal({ ...local, email: { ...local.email, enabled: e.target.checked } })
              }
            />
            <span>{t("Email")}</span>
          </label>

          <div
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              minHeight: "38px",

              display: "flex",
              alignItems: "center",
              gap: "6px",

              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            {emailChips.map((mail, index) =>
              editingType === "email" && editingIndex === index ? (
                <input
                  key={index}
                  value={editingValue}
                  autoFocus
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={saveEdit}
                  style={{
                    backgroundColor: "var(--bs-primary)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    flexShrink: 0, // 🔑 chip never shrinks
                  }}
                />
              ) : (
                <span
                  key={mail}
                  className="bg-primary text-white px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
                  style={{ fontSize: "0.8rem", cursor: "pointer" }}
                  onClick={() => startEdit("email", index)}
                >
                  {mail}
                  <span
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEmail(mail);
                    }}
                  >
                    ×
                  </span>
                </span>
              )
            )}

            <input
              disabled={!local.email?.enabled}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder={emailChips.length === 0 ? t("Email addresses, comma separated") : ""}
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                backgroundColor: "transparent",
                flex: 1,
                minWidth: "140px",
                height: "30px",
              }}
            />
          </div>
        </div>

        {/* Mobile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "10px",
            width: "530px",
            maxWidth: "100%",
          }}
        >
          <label
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Checkbox
              checked={local.mobile?.enabled}
              onChange={(e) =>
                setLocal({ ...local, mobile: { ...local.mobile, enabled: e.target.checked } })
              }
            />
            <span>{t("Mobile")}</span>
          </label>

          <div
            style={{
              padding: "0.4rem 0.6rem",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              minHeight: "38px",

              display: "flex",
              alignItems: "center",
              gap: "6px",

              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            {mobileChips.map((phone, index) =>
              editingType === "mobile" && editingIndex === index ? (
                <input
                  key={index}
                  value={editingValue}
                  autoFocus
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={saveEdit}
                  style={{
                    minWidth: "140px",
                    borderRadius: "12px",
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    border: "1px solid #0d6efd",
                  }}
                />
              ) : (
                <span
                  key={phone}
                  className="bg-primary text-white px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
                  style={{ fontSize: "0.8rem", cursor: "pointer", flexShrink: 0 }}
                  onClick={() => startEdit("mobile", index)}
                >
                  {phone}
                  <span
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMobile(phone);
                    }}
                  >
                    ×
                  </span>
                </span>
              )
            )}

            <input
              disabled={!local.mobile?.enabled}
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
              onKeyDown={handleMobileKeyDown}
              placeholder={mobileChips.length === 0 ? t("Mobile numbers, comma separated") : ""}
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                backgroundColor: "transparent",
                flex: 1,
                minWidth: "140px",
                height: "30px",

              }}
            />
          </div>
        </div>


        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "10px" }}>
          <label style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Checkbox
              checked={local.telegram?.enabled}
              onChange={(e) =>
                setLocal({ ...local, telegram: { ...local.telegram, enabled: e.target.checked } })
              }
            />
            {t("Telegram")}
          </label>
          <input
            disabled={!local.telegram?.enabled}
            placeholder={t("Telegram bot token")}
            value={local.telegram?.bot_token || ""}
            onChange={(e) =>
              setLocal({ ...local, telegram: { ...local.telegram, bot_token: e.target.value } })
            }
            style={{
              padding: "0.4rem 0.6rem",
              // borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "42px",
              width: "530px",

            }}
          />
          <input
            disabled={!local.telegram?.enabled}
            placeholder={t("Telegram chat ID")}
            value={local.telegram?.chat_id || ""}
            onChange={(e) =>
              setLocal({ ...local, telegram: { ...local.telegram, chat_id: e.target.value } })
            }
            style={{
              padding: "0.4rem 0.6rem",
              // borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              backgroundColor: "#fff",
              height: "42px",
              width: "530px",
            }}
          />
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "10px",
        }}>
          <Checkbox
            checked={local.alerts_enabled}
            onChange={(e) => setLocal({ ...local, alerts_enabled: e.target.checked })}
          />
          <label style={{ fontWeight: 500 }}>{t("Enable Alerts")}</label>
        </div>
        <div className="form-button-group" style={{ marginLeft: 15, marginBottom: "20px" }}>

          <button className="outlined-button" onClick={back}>
            {t("Cancel")}
          </button>
          <button className="filled-button"
            onClick={update} >
            {t("Update Group")}
          </button>


        </div>
      </div>
    </div>
  );
};

export default EditManager;