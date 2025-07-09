import styles from "../styles/Spinner.module.css";

export default function Spinner() {
  return (
    <div className={styles["lds-ripple"]}>
      <div></div>
      <div></div>
    </div>
  );
}
