from tools.jobspy_tool import _extract_job_level, _extract_years_of_experience
from tools.openai_tool import _parse_json_response
from graph.agent_cards import AGENT_CARDS, PIPELINE_ORDER
from graph.graph_builder import _should_continue_after_scoring, compiled_graph


def test_job_level_extraction():
    assert _extract_job_level("We need a Senior Python engineer") == "Senior"
    assert _extract_job_level("Junior developer wanted") == "Junior"
    assert _extract_job_level("Head of Engineering") == "Director"
    assert _extract_job_level("") == ""


def test_years_of_experience_extraction():
    assert _extract_years_of_experience("Requires 3-5 years of experience") == "3-5 years of experience"
    assert _extract_years_of_experience("5+ years Python").startswith("5+ years")
    assert _extract_years_of_experience("no numbers here") == ""


def test_parse_json_response_plain_and_fenced():
    assert _parse_json_response('{"score": 80, "reason": "good"}')["score"] == 80
    assert _parse_json_response('```json\n{"score": 55, "reason": "ok"}\n```')["score"] == 55
    # Falls back to regex when JSON is malformed
    assert _parse_json_response('oops "score": 42 broken')["score"] == 42


def test_conditional_edge_routing():
    assert _should_continue_after_scoring({"scored_jobs": [{"score": 70}]}) == "cover_letter_agent"
    assert _should_continue_after_scoring({"scored_jobs": []}) == "storage_agent"
    assert _should_continue_after_scoring({"scored_jobs": [{"score": 70}], "error": "x"}) == "storage_agent"


def test_agent_cards_match_pipeline():
    assert [c["node_id"] for c in AGENT_CARDS] == PIPELINE_ORDER


def test_graph_compiles_with_all_nodes():
    nodes = set(compiled_graph.get_graph().nodes)
    for n in PIPELINE_ORDER:
        assert n in nodes
