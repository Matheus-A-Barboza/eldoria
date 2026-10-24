from app.campaigns_api import prologue

def test_prologue_personalized():
    text = prologue({"name": "Arin", "background": "erudito", "personal_history": "Aprendeu magia na torre."})
    assert "Arin" in text
    assert "manuscrito" in text
    assert "Aprendeu magia" in text
    assert "O que faz?" in text
