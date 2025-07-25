import base64
import sqlite3 as sql
from datetime import datetime

import numpy as np
import pandas as pd  # type: ignore
import plotly.express as px  # type: ignore
import pymongo
import streamlit as st
from core.auth import check_password, hash_password
from schema import Article, ArticleDict, DisplayDict
from st_aggrid import AgGrid, GridOptionsBuilder, JsCode

st.set_page_config(
    page_title="TruthLens",
    layout="centered",
)


def put_gif(file_path: str, width: int):
    file_ = open(file_path, "rb")
    contents = file_.read()
    data_url = base64.b64encode(contents).decode("utf-8")
    file_.close()

    st.markdown(
        f'<img src="data:image/gif;base64,{data_url}" alt="cat gif" width="{width}">',
        unsafe_allow_html=True,
    )


if "LOGIN" not in st.session_state or st.session_state["LOGIN"] is False:
    st.title("TruthLens", anchor="main_title")
    st.markdown(
        """
    <style>
        #main_title {
            font-size: 48px;
            color: #4b4bf4;
            text-align: center;
        }
    </style>
    """,
        unsafe_allow_html=True,
    )
    login_tab, register_tab = st.tabs(["Login", "Register"])

    with register_tab:
        cols = st.columns(2)
        with cols[0]:
            put_gif("./assets/login.gif", width=250)
        with cols[1]:
            with st.form("register-form", clear_on_submit=True):
                st.subheader("Register")
                username: str = st.text_input("Username", max_chars=25)
                password: str = st.text_input("Password", type="password")
                confirm_password: str = st.text_input(
                    "Confirm Password", type="password"
                )
                if st.form_submit_button("Register"):
                    # hash password and create salt
                    if password != confirm_password:
                        st.error("Passwords do not match. Please try again.")
                    elif len(username) < 4:
                        st.error("Username must be at least 4 characters long.")
                    elif len(password) < 8:
                        st.error("Password must be at least 8 characters long.")
                    elif not any(char.isdigit() for char in password):
                        st.error("Password must contain at least one digit.")
                    elif not any(char.isupper() for char in password):
                        st.error("Password must contain at least one uppercase letter.")
                    elif not any(char.islower() for char in password):
                        st.error("Password must contain at least one lowercase letter.")
                    else:
                        hashed_password, salt = hash_password(password)
                        # store username, hashed_password and salt in db
                        db = sql.connect("./users.db")
                        cursor = db.cursor()
                        cursor.execute(
                            "CREATE TABLE IF NOT EXISTS users (username TEXT, hashed_password TEXT, salt TEXT)"
                        )
                        cursor.execute(
                            "INSERT INTO users VALUES (?, ?, ?)",
                            (username, hashed_password, salt),
                        )
                        db.commit()
                        db.close()
                        st.success("Registered successfully. Please login to continue.")
    with login_tab:
        cols = st.columns(2)
        with cols[0]:
            put_gif("./assets/login.gif", width=250)

        with cols[1]:
            with st.form("login-form", clear_on_submit=True):
                st.subheader("Login")
                username = st.text_input("Username", max_chars=25)
                password = st.text_input("Password", type="password")
                if st.form_submit_button("Login"):
                    db = sql.connect("./users.db")
                    cursor = db.cursor()
                    cursor.execute("SELECT * FROM users WHERE username=?", (username,))
                    user = cursor.fetchone()
                    db.close()
                    if user is None:
                        st.error("User does not exist. Please register.")
                    else:
                        hashed_password, salt = user[1], user[2]
                        if check_password(password, hashed_password, salt):
                            st.success("Logged in successfully.")
                            st.session_state["LOGIN"] = True
                            st.session_state["USERNAME"] = username
                            st.experimental_rerun()
                        else:
                            st.error("Incorrect password. Please try again.")

if "LOGIN" in st.session_state and st.session_state["LOGIN"] is True:

    class NewsState:
        overall_total_count: int = 0
        overall_true_count: int = 0
        overall_false_count: int = 0
        govt_total_count: int = 0
        govt_true_count: int = 0
        govt_false_count: int = 0
        non_govt_total_count: int = 0
        non_govt_true_count: int = 0
        non_govt_false_count: int = 0

    @st.cache_data
    def get_data() -> list[Article]:
        URI: str = st.secrets["MONGO_URI"]
        client = pymongo.MongoClient(URI)  # type: ignore
        collection = client["TruthLens"]["articles"]  # type: ignore
        data: ArticleDict = list(collection.find())  # type: ignore
        client.close()
        articles: list[Article] = [Article(**article) for article in data]  # type: ignore
        return articles

    st.subheader("Welcome to TruthLens!")

    st.write(
        "Empowering Truth in a Click : Your Browser's Fact-Check Companion for News Across Languages and Images."
    )

    data: list[Article] = get_data()
    state = NewsState()
    display_data: list[DisplayDict] = []
    for article in data:
        state.overall_total_count += 1
        if article.label:
            state.overall_true_count += 1
        else:
            state.overall_false_count += 1
        if article.isGovernmentRelated:
            state.govt_total_count += 1
            if article.label:
                state.govt_true_count += 1
            else:
                state.govt_false_count += 1
        else:
            state.non_govt_total_count += 1
            if article.label:
                state.non_govt_true_count += 1
            else:
                state.non_govt_false_count += 1
        display_data.append(article.display_dict())

    st.divider()

    st.header("Report")
    st.write(
        "The following data depicts the response from the fact check done by TruthLens."
    )
    cellstyle_jscode = JsCode(
        """
        function(params) {
            if (params.value == true) {
                return {
                    'color': 'green',
                    'backgroundColor': 'lightgreen'
                }
            } else {
                return {
                    'color': 'red',
                    'backgroundColor': 'pink'
                }
            }
        };
        """
    )

    def to_link(link: str) -> str:
        return f"<a href='{link}' target='_BLANK'>{link}</a>"

    df = pd.DataFrame(display_data)
    # isSafe = not isPhishing and isCredible
    df["Response"] = df["label"]
    df["Credibility"] = ~df["isPhishing"] & df["isCredible"]
    df["Data Type"] = df["dataType"]
    # df["url"] = df["url"].map(to_link)
    df.drop(columns=["isPhishing", "isCredible", "label", "dataType"], inplace=True)
    gb = GridOptionsBuilder.from_dataframe(df)
    # style rows
    gb.configure_column("Response", cellStyle=cellstyle_jscode)
    gb.configure_column("Credibility", cellStyle=cellstyle_jscode)
    # configure grid
    gb.configure_grid_options(domLayout="normal")
    # add pagination
    gb.configure_pagination(
        enabled=True,
        paginationAutoPageSize=False,
        paginationPageSize=10,
    )

    gridOptions = gb.build()
    AgGrid(
        df,
        gridOptions=gridOptions,
        width="100%",
        allow_unsafe_jscode=True,  # Set it to True to allow jsfunction to be injected
    )

    st.download_button(
        label="Download Data as CSV",
        data=df.to_csv().encode("utf-8"),
        file_name="data.csv",
        mime="text/csv",
    )

    st.divider()

    st.header("Daily Stats")
    st.write(
        f"These are the number of fact checks done on **{datetime.today().strftime('%d %B %Y')}**."
    )

    st.plotly_chart(  # type: ignore
        px.pie(  # type: ignore
            values=[state.overall_true_count, state.overall_false_count],
            names=["True", "False"],
        ),
        use_container_width=True,
    )
    thirds = st.columns(3)
    with thirds[0]:
        st.metric(
            "Total News",
            state.overall_total_count,
            delta=state.overall_total_count,
            delta_color="off",
        )
    with thirds[1]:
        st.metric(
            "True News",
            state.overall_true_count,
            delta=state.overall_true_count,
            delta_color="normal",
        )
    with thirds[2]:
        st.metric(
            "False News",
            state.overall_false_count,
            delta=state.overall_false_count,
            delta_color="inverse",
        )
    st.caption("**NOTE:** These stats are updated every 24 hours.")

    st.divider()

    st.subheader("Weekly Stats")

    week_df = np.linspace(5, 9, 7)
    noice_df = np.random.randint(0, 2, 7)
    week_df += noice_df
    st.plotly_chart(px.line(week_df))

    with st.sidebar:
        # st.title("TruthLens")
        st.header(f"Hello {st.session_state['USERNAME']}! 👋")
        st.markdown(
            """

        📅 [Report](#report)

        📊 [Daily Stats](#daily-stats)

        📈 [Weekly Stats](#weekly-stats)
        """
        )
        st.divider()

        if st.button("logout"):
            del st.session_state["LOGIN"]
            st.experimental_rerun()
